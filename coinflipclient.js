let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let crypto = require('crypto');
let base58 = require('bs58');

let utils = require('./utils.js');


// CoinFlipClient class represents 1 bet's state management
module.exports = class CoinFlipClient {
    
    wallet = {};
    betState = {};
    feed;

    constructor(wif, pubkey, address, feed){
        this.wallet.wif = wif;
        this.wallet.pubkey = pubkey;
        this.wallet.address = address;

        this.betState.phase = 1;

        // set shared chainfeed listener (each client will periodically check for messages)
        // in future can set filter within the feed to improve performance
        feed = feed;

        // start managing client state for a single bet workflow
        this.run();
    }

    async run(){

        // 1) keep checking for a host to bet with
        while(this.betState.phase == 1){
            if(this.feed.messages.where(m => m.phase == 1)){
                this.betState.betTxnId = "...";
                this.betState.phase = 2;
            }
            await utils.sleep(500);
        }

        // 2) send host our acceptance message
        CoinFlipClient.sendPhase2Message("...");
        this.betState.phase = 3;

        // 3) keep checking for host to fund his side of bet...
        while(this.betState.phase == 3){
            if(this.feed.messages.where(m => m.phase == 3 && m.betTxId == this.betState.betTxId)){
                this.betState.hostMultiSigPubKey = "..."; // need this to create our escrow
                this.betState.hostP2phTxId = "..."; // (future) can use this to check if host has a serious bet going 
                this.betState.phase = 4;
            }
            await utils.sleep(500);
        }

        // 4) send host our funding message
        CoinFlipClient.sendPhase4Message("...");
        this.betState.phase = 5;

        // 5) keep check to see if the host's P2SH escrow has been spent.
        while(this.betState.phase == 5){
            
            var rawTxn = BITBOX.some_method_to_get_raw_transaction();
            var secret = this.extractSecretFromRawTransaction(rawTxn);
            if(secret != ""){
                // 
                this.betState.hostSecret = secret;
                this.betState.phase == 6;
            }
            await utils.sleep(500);
        }

        // 6) Send 
        CoinFlipClient.sendPhase6Message("...");
        this.betState.phase = 7; // 7 means all bet steps are completed...
    }

    static sendPhase2Message(){

        // NOTE: invoke core protocol methods from client.js

    }

    static sendPhase5Message(){

        // NOTE: invoke core protocol methods from client.js

    }

    static sendPhase6Message(){

        // NOTE: invoke core protocol methods from client.js

    }

    static buildEscrowScript(hostPubKey, clientPubKey){
        let script = [
            BITBOX.Script.opcodes.OP_IF, 
            BITBOX.Script.opcodes.OP_2,
            hostPubKey.length
        ]
        
        hostPubKey.forEach(i => script.push(i));
        script.push(clientPubKey.length);
        clientPubKey.forEach(i => script.push(i));
    
        script = script.concat([
            BITBOX.Script.opcodes.OP_2,
            BITBOX.Script.opcodes.OP_CHECKMULTISIG,
            BITBOX.Script.opcodes.OP_ELSE,
            0x51, // use 0x58 for 8 blocks
            BITBOX.Script.opcodes.OP_CHECKSEQUENCEVERIFY,
            BITBOX.Script.opcodes.OP_DROP,
            hostPubKey.length
        ]);
    
        hostPubKey.forEach(i => script.push(i));
        script = script.concat([
            BITBOX.Script.opcodes.OP_CHECKSIG,
            BITBOX.Script.opcodes.OP_ENDIF
        ]);
        
        return BITBOX.Script.encode(script);
    }

    static async clientClaimWin(wallet, betScript, betTxId, betAmount){
        return new Promise( (resolve, reject) => {
    
            let hostKey = BITBOX.ECPair.fromWIF(wallet.wif)
            let clientKey = BITBOX.ECPair.fromWIF(client.wif)
            let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');
    
            let hashType = 0xc1 // transactionBuilder.hashTypes.SIGHASH_ANYONECANPAY | transactionBuilder.hashTypes.SIGHASH_ALL
            let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2SH: 1 });
            let satoshisAfterFee = betAmount - byteCount - 800;
            transactionBuilder.addInput(betTxId, 0)
            transactionBuilder.addOutput(wallet.utxo[0].cashAddress, satoshisAfterFee);
    
            let tx = transactionBuilder.transaction.buildIncomplete();
    
            // Sign bet tx
            let sigHash = tx.hashForWitnessV0(0, betScript, betAmount, hashType);
            let hostSig = hostKey.sign(sigHash).toScriptSignature(hashType);
            let clientSig = clientKey.sign(sigHash).toScriptSignature(hashType);
    
            let redeemScriptSig = []
    
            // client signature
            redeemScriptSig.push(clientSig.length)
            clientSig.forEach((item, index) => { redeemScriptSig.push(item); });
    
            // host secret
            redeemScriptSig.push(host.secret.length);
            host.secret.forEach((item, index) => { redeemScriptSig.push(item); });
    
            // client secret
            redeemScriptSig.push(client.secret.length);
            client.secret.forEach((item, index) => { redeemScriptSig.push(item); });
    
            redeemScriptSig.push(0x00); // zero is client wins mode
    
            if (betScript.length > 75) redeemScriptSig.push(0x4c);
            redeemScriptSig.push(betScript.length);
            betScript.forEach((item, index) => { redeemScriptSig.push(item); });
            
            redeemScriptSig = Buffer(redeemScriptSig);
            tx.setInputScript(0, redeemScriptSig);
            
            // uncomment for viewing script hex
            // let redeemScriptSigHex = redeemScriptSig.toString('hex');
            // let redeemScriptHex = redeemScript.toString('hex');
            
            let hex = tx.toHex();
            
            console.log("clientClaimWin hex:", hex);
            BITBOX.RawTransactions.sendRawTransaction(hex).then((result) => { 
                console.log('clientClaimWin txid:', result);
                if (result.length < 60) // Very rough txid size check for failure
                    reject("txid too small");
                else {
                    resolve(result);
                }
            }, (err) => { 
                console.log(err);
                reject(err);
            });
        });
    }
}
