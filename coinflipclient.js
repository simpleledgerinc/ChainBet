let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();
var inquirer = require('inquirer');

let Utils = require('./utils');
let Client = require('./client');
let Core = require('./core');

// CoinFlipClient class represents 1 bet's state management
module.exports = class CoinFlipClient extends Client {
    constructor(wif, pubkey, address, feed){ //, cliLock){
        super();
        this.wallet = {};
        this.wallet.wif = wif;
        this.wallet.pubkey = pubkey;
        this.wallet.address = address;

        this.betState = {};
        this.betState.phase = 1;

        // set shared chainfeed listener (each client will periodically check for messages)
        // in future can set filter within the feed to improve performance
        this.feed = feed;

        // this object will allow user to be prompted questions for multiple bets without conflict
        //this.cliLock = cliLock;

        // start managing client state for a single bet workflow
        this.run();
    }

    async run(){

        // Phase 1 -- keep checking for a host to bet with
        console.log('\n---------------------------------------------------')
        console.log('| PHASE 1: Waiting for a host bet announcement... |');
        console.log('---------------------------------------------------')

        while(this.betState.phase == 1) {

            var hostPhase1Messages = this.feed.messages.filter(function(item){ 
                return item.phase == 1 & item.type == 1; 
            });

            if(hostPhase1Messages.length > 0){
                
                // ignore target address field from host for now...
                let newBet = hostPhase1Messages[hostPhase1Messages.length-1];
                this.betState.hostCommitment = newBet.hostCommitment;
                this.betState.betTxId = newBet.op_return_txnId;
                this.betState.amount = newBet.amount;

                // NOTE: to simplify we will automatically accept the first bet host we see
                console.log("Coin flip bet discovered! (automatically accepting...)");
                console.log("Bet Txn Id: " + this.betState.betTxId);

                this.betState.phase = 2;
            }
            await Utils.sleep(500);
        }

        // Phase 2 -- allow user to choose a secret number then send host our acceptance message
        //let answer = await inquirer.prompt([{type: "input", name: "secret", message: "Choose a secret number: "}]);
        //this.betState.secret = Utils.secret_2_buf(parseInt(answer.secret)); 
        this.betState.secret = Buffer("c667c14e218cf530c405e2d50def250b0c031f69593e95171048c772ad0e1bce",'hex');
        this.betState.secretCommitment = BITBOX.Crypto.hash160(this.betState.secret);
        console.log('\n--------------------------------------------------------------')
        console.log("| PHASE 2: Accepting bet & sending our secret commitment... |");
        console.log('-------------------------------------------------------------')

        this.betState.clientTxId = await CoinFlipClient.sendPhase2Message(this.wallet, this.betState.betTxId, this.wallet.pubkey, this.betState.secretCommitment);
        console.log("Msg set to accept the Host's bet (txn: " + this.betState.clientTxId + ")")
        this.betState.phase = 3;

        // Phase 3 -- keep checking for host to fund his side of bet...
        console.log('\n--------------------------------------------------------------')
        console.log("| PHASE 3: Waiting for host confirmation & to fund his bet... |");
        console.log('--------------------------------------------------------------')

        while(this.betState.phase == 3) {

            let betId = this.betState.betTxId;
            let clientId = this.betState.clientTxId;

            var clientPhase3Messages = this.feed.messages.filter(function(item){ 
                if(item.phase == 3) {
                    if(item.betTxId.toString('hex') == betId && item.participantOpReturnTxId.toString('hex') == clientId){ 
                        return true; }
                }
                return false;
            });

            if(clientPhase3Messages.length > 0){
                // ignore target address field from host for now...
                // assume its the host who is sending the message (TODO this will need to be fixed to prevent fake hosts)
                let bet = clientPhase3Messages[clientPhase3Messages.length-1];
                this.betState.hostMultisigPubKey = bet.hostMultisigPubKey;
                this.betState.hostP2SHTxId = bet.hostP2SHTxId.toString('hex');

                // NOTE: to simplify we will automatically accept the first bet host we see
                console.log("The bet host has fund a bet with you! :-) (txn id:" + bet.op_return_txnId + ")");

                this.betState.phase = 4;
            }
            await Utils.sleep(500);
        }

        // Phase 4 -- Send Host your Escrow Details
        console.log('\n-------------------------------------------------------------')
        console.log("|     PHASE 4: Funding our side of the bet...               |");
        console.log('-------------------------------------------------------------')

        let escrowBuf = Core.buildCoinFlipClientEscrowScript(this.betState.hostMultisigPubKey, this.wallet.pubkey);
        //console.log(BITBOX.Script.toASM(escrowBuf));
        this.wallet.utxo = await Core.getUtxo(this.wallet.address);
        let escrowTxid = await Core.createEscrow(this.wallet, escrowBuf, this.betState.amount);
        console.log('Our Escrow Txn: ' + escrowTxid);
        await Utils.sleep(3000); // need to wait for BITBOX mempool to sync

        console.log('Sending client phase 4 message with our escrow details and 2 escrow signatures...');
        let betScriptBuf = Core.buildCoinFlipBetScriptBuffer(this.betState.hostMultisigPubKey, this.betState.hostCommitment, this.wallet.pubkey, this.betState.secretCommitment);
        // build bob's signatures
        let bobEscrowSig = CoinFlipClient.createEscrowSignature(this.wallet, escrowTxid, escrowBuf, this.betState.amount, betScriptBuf);
        bobEscrowSig = Utils.padSig(bobEscrowSig);
        let hostEscrowBuf = Core.buildCoinFlipHostEscrowScript(this.betState.hostMultisigPubKey, this.betState.hostCommitment, this.wallet.pubkey);
        let aliceEscrowSig = CoinFlipClient.createEscrowSignature(this.wallet, this.betState.hostP2SHTxId, hostEscrowBuf, this.betState.amount, betScriptBuf);
        aliceEscrowSig = Utils.padSig(aliceEscrowSig);

        // prepare to send Phase 4 OP_RETURN
        let phase4MsgTxId = await CoinFlipClient.sendPhase4Message(this.wallet, this.betState.betTxId, escrowTxid, bobEscrowSig, aliceEscrowSig);
        console.log('Phase 4 message sent: ' + phase4MsgTxId);
        this.betState.phase = 5;

        console.log('\n-------------------------------------------------------------')
        console.log("|     PHASE 5: Waiting for host to broadcast coin flip...      |");
        console.log('-------------------------------------------------------------')
        // // 5) keep check to see if the host's P2SH escrow has been spent (indicates bet is created).

        // Determine bet address
        let host_p2sh_hash160 = BITBOX.Crypto.hash160(hostEscrowBuf);
        let host_p2sh_scriptPubKey = BITBOX.Script.scriptHash.output.encode(host_p2sh_hash160);
        let host_p2sh_Address = BITBOX.Address.fromOutputScript(host_p2sh_scriptPubKey);

        while(this.betState.phase == 5){
            var details = await BITBOX.Address.details(host_p2sh_Address);

            if(details.balance == 0){
                var txn = details.transactions[0];
                //var txn_details = await BITBOX.Transaction.details(txn);
                var raw_txn = await BITBOX.RawTransactions.getRawTransaction(txn);
                var decoded_txn = await BITBOX.RawTransactions.decodeRawTransaction(raw_txn);
                var hostScriptSig = decoded_txn.vin[0].scriptSig;
            }

            await Utils.sleep(500);
        }

        // // 6) Send 
        // CoinFlipClient.sendPhase6Message("...");
        this.betState.phase = 7; // 7 means all bet steps are completed...
    }

    static createEscrowSignature(wallet, escrowTxId, escrowScript, betAmount, betScript){
        let clientKey = BITBOX.ECPair.fromWIF(wallet.wif)
        let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');

        let hashType = 0xc1 // transactionBuilder.hashTypes.SIGHASH_ANYONECANPAY | transactionBuilder.hashTypes.SIGHASH_ALL
        let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2SH: 1 });
        let satoshisAfterFee = (betAmount * 2 ) - byteCount - 750;
        transactionBuilder.addInput(escrowTxId, 0); // No need to worry about sweeping the P2SH address.      

        // Determine bet address
        let p2sh_hash160 = BITBOX.Crypto.hash160(betScript);
        let scriptPubKey = BITBOX.Script.scriptHash.output.encode(p2sh_hash160);
        let betAddress = BITBOX.Address.fromOutputScript(scriptPubKey)
        transactionBuilder.addOutput(betAddress, satoshisAfterFee);

        let tx = transactionBuilder.transaction.buildIncomplete();

        // Sign escrow utxo
        let sigHash = tx.hashForWitnessV0(0, escrowScript, betAmount, hashType);
        let sig = clientKey.sign(sigHash).toScriptSignature(hashType);
        return sig;
    }

    static async sendPhase2Message(wallet, betTxId, multisigPubKey, secretCommitment){
        let phase2Buf = this.encodePhase2Message(betTxId, multisigPubKey, secretCommitment);
        // console.log("Phase 2 OP_RETURN (hex): " + phase2Buf.toString('hex'));
        // console.log("Phase 2 OP_RETURN (ASM): " + BITBOX.Script.toASM(phase2Buf));
        wallet.utxo = await Core.getUtxo(wallet.address);
        let txnId = await Core.createOP_RETURN(wallet, phase2Buf);
        return txnId;
    }

    static async sendPhase4Message(wallet, betTxId, escrowTxid, bobEscrowSig, aliceEscrowSig){
        let phase4Buf = this.encodePhase4(betTxId, escrowTxid, bobEscrowSig, aliceEscrowSig);
        // console.log("Phase 4 OP_RETURN (hex): " + phase4Buf.toString('hex'));
        // console.log("Phase 4 OP_RETURN (ASM): " + BITBOX.Script.toASM(phase4Buf));
        wallet.utxo = await Core.getUtxo(wallet.address);
        let txnId = await Core.createOP_RETURN(wallet, phase4Buf);
        return txnId;
    }

    static sendPhase6Message(){

        // NOTE: invoke core protocol methods from client.js

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
