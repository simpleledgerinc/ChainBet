let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let crypto = require('crypto');
let base58 = require('bs58');

// CoinFlipClient class represents 1 bet's state management
module.exports = class CoinFlipHost {
    
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
    
        // USE CoinFlipClient as an example of how this needs to be build.

    }

	static sendPhase1Message(amount, targetAddress){
		let phase1Buf = CoreHost.encodePhase1Message(0x01, amount, targetAddress);
		// send message
		return txnId;
    }
    
    static buildHostEscrowScript(hostPubKey, hostCommitment, clientPubKey){
    
        let script = [
            BITBOX.Script.opcodes.OP_IF, 
            BITBOX.Script.opcodes.OP_HASH160,
            hostCommitment.length
        ];
        
        hostCommitment.forEach(i => script.push(i));
    
        script = script.concat([
            BITBOX.Script.opcodes.OP_EQUALVERIFY,
            BITBOX.Script.opcodes.OP_2,
            hostPubKey.length
        ]);
        
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

	static buildBetScript(hostPubKey, hostCommitment, clientPubKey, clientCommitment){
		let script = [
			BITBOX.Script.opcodes.OP_IF,
			BITBOX.Script.opcodes.OP_IF,
			BITBOX.Script.opcodes.OP_HASH160,
			clientCommitment.length
		];
		
		clientCommitment.forEach(i => script.push(i));
	
		script = script.concat([
			BITBOX.Script.opcodes.OP_EQUALVERIFY,
			BITBOX.Script.opcodes.OP_ELSE,
			0x51, // use 0x58 for 8 blocks
			BITBOX.Script.opcodes.OP_CHECKSEQUENCEVERIFY,
			BITBOX.Script.opcodes.OP_DROP,
			BITBOX.Script.opcodes.OP_ENDIF,
			hostPubKey.length
		]);
		
		hostPubKey.forEach(i => script.push(i));
	
		script = script.concat([
			BITBOX.Script.opcodes.OP_CHECKSIG,
			BITBOX.Script.opcodes.OP_ELSE,
			BITBOX.Script.opcodes.OP_DUP,
			BITBOX.Script.opcodes.OP_HASH160,
			clientCommitment.length
		]);
		clientCommitment.forEach(i => script.push(i));
	
		script = script.concat([
			BITBOX.Script.opcodes.OP_EQUALVERIFY,
			BITBOX.Script.opcodes.OP_OVER,
			BITBOX.Script.opcodes.OP_HASH160,
			hostCommitment.length
		]);
		hostCommitment.forEach(i => script.push(i));
	
		script = script.concat([
			BITBOX.Script.opcodes.OP_EQUALVERIFY,
			BITBOX.Script.opcodes.OP_4,
			BITBOX.Script.opcodes.OP_SPLIT,
			BITBOX.Script.opcodes.OP_DROP,
			BITBOX.Script.opcodes.OP_BIN2NUM,
			BITBOX.Script.opcodes.OP_SWAP,
			BITBOX.Script.opcodes.OP_4,
			BITBOX.Script.opcodes.OP_SPLIT,
			BITBOX.Script.opcodes.OP_DROP,
			BITBOX.Script.opcodes.OP_BIN2NUM,
			BITBOX.Script.opcodes.OP_ADD,
			BITBOX.Script.opcodes.OP_2,
			BITBOX.Script.opcodes.OP_MOD,
			BITBOX.Script.opcodes.OP_0,
			BITBOX.Script.opcodes.OP_EQUALVERIFY,
			clientPubKey.length
		]);
		clientPubKey.forEach(i => script.push(i));
	
		script = script.concat([
			BITBOX.Script.opcodes.OP_CHECKSIG,
			BITBOX.Script.opcodes.OP_ENDIF,
		]);
		
		return BITBOX.Script.encode(script);
    }
    
    static async redeemEscrowToMakeBet(wallet, hostRedeemScript, clientRedeemScript, betScript, hostTxId, clientTxId, betAmount){
        return new Promise( (resolve, reject) => {
    
            let hostKey = BITBOX.ECPair.fromWIF(wallet.wif)
            let clientKey = BITBOX.ECPair.fromWIF(client.wif)
            let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');
    
            let hashType = 0xc1 // transactionBuilder.hashTypes.SIGHASH_ANYONECANPAY | transactionBuilder.hashTypes.SIGHASH_ALL
            let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2SH: 1 });
            let satoshisAfterFee = (betAmount*2) - byteCount - 750;
            transactionBuilder.addInput(hostTxId, 0); // No need to worry about sweeping the P2SH address.      
            transactionBuilder.addInput(clientTxId, 0)
    
            // Determine bet address
            let p2sh_hash160 = BITBOX.Crypto.hash160(betScript);
            let scriptPubKey = BITBOX.Script.scriptHash.output.encode(p2sh_hash160);
            let betAddress = BITBOX.Address.fromOutputScript(scriptPubKey)
            transactionBuilder.addOutput(betAddress, satoshisAfterFee);
    
            let tx = transactionBuilder.transaction.buildIncomplete();
    
            // Sign alices escrow
            let sigHash = tx.hashForWitnessV0(0, hostRedeemScript, betAmount, hashType);
            let hostSig = hostKey.sign(sigHash).toScriptSignature(hashType);
            let clientSig = clientKey.sign(sigHash).toScriptSignature(hashType);
    
            let redeemScriptSig = []; // start by pushing with true for makeBet mode
    
            // multisig off by one fix
            redeemScriptSig.push(BITBOX.Script.opcodes.OP_0);
    
            // host signature
            redeemScriptSig.push(hostSig.length);
            hostSig.forEach((item, index) => { redeemScriptSig.push(item); });
    
            // participant signature
            redeemScriptSig.push(clientSig.length)
            clientSig.forEach((item, index) => { redeemScriptSig.push(item); });
            
            // alice secret
            redeemScriptSig.push(wallet.secret.length);
            wallet.secret.forEach((item, index) => { redeemScriptSig.push(item); });
    
            // push mode onto stack for MakeBet mode
            redeemScriptSig.push(0x51); // non-zero is makeBet mode
    
            if (hostRedeemScript.length > 75) redeemScriptSig.push(0x4c);
            redeemScriptSig.push(hostRedeemScript.length);
            hostRedeemScript.forEach((item, index) => { redeemScriptSig.push(item); });
            
            redeemScriptSig = Buffer(redeemScriptSig);
            tx.setInputScript(0, redeemScriptSig);
    
            // Sign bob's escrow
            let sigHash2 = tx.hashForWitnessV0(1, clientRedeemScript, betAmount, hashType);
            let hostSig2 = hostKey.sign(sigHash2).toScriptSignature(hashType);
            let clientSig2 = clientKey.sign(sigHash2).toScriptSignature(hashType);
    
            let redeemScriptSig2 = []
    
            // multisig off by one fix
            redeemScriptSig2.push(BITBOX.Script.opcodes.OP_0)
    
            // host signature
            redeemScriptSig2.push(hostSig2.length)
            hostSig2.forEach((item, index) => { redeemScriptSig2.push(item); })
    
            // participant signature
            redeemScriptSig2.push(clientSig2.length)
            clientSig2.forEach((item, index) => { redeemScriptSig2.push(item); });
    
            // push mode onto stack for MakeBet mode
            redeemScriptSig2.push(0x51); // non-zero is makeBet mode
    
            if (clientRedeemScript.length > 75) redeemScriptSig2.push(0x4c)
            redeemScriptSig2.push(clientRedeemScript.length)
            clientRedeemScript.forEach((item, index) => { redeemScriptSig2.push(item); });
            
            redeemScriptSig2 = Buffer(redeemScriptSig2)
            tx.setInputScript(1, redeemScriptSig2)
            
            // uncomment for viewing script hex
            // let redeemScriptSigHex = redeemScriptSig.toString('hex');
            // let redeemScriptHex = redeemScript.toString('hex');
            
            let hex = tx.toHex();
            
            console.log("Redeem escrow hex:", hex);
            BITBOX.RawTransactions.sendRawTransaction(hex).then((result) => { 
                console.log('Redeem escrow txid:', result);
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


    static async hostClaimWinSecret(wallet, betScript, betTxId, betAmount){
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

            let redeemScriptSig = []; // start by pushing with true for makeBet mode

            // host signature
            redeemScriptSig.push(hostSig.length)
            hostSig.forEach((item, index) => { redeemScriptSig.push(item); });

            // client secret
            redeemScriptSig.push(client.secret.length);
            client.secret.forEach((item, index) => { redeemScriptSig.push(item); });

            // Host wins with client secret mode
            redeemScriptSig.push(0x51);
            redeemScriptSig.push(0x51);

            if (betScript.length > 75) redeemScriptSig.push(0x4c);
            redeemScriptSig.push(betScript.length);
            betScript.forEach((item, index) => { redeemScriptSig.push(item); });
            
            redeemScriptSig = Buffer(redeemScriptSig);
            tx.setInputScript(0, redeemScriptSig);
            
            // uncomment for viewing script hex
            // let redeemScriptSigHex = redeemScriptSig.toString('hex');
            // let redeemScriptHex = redeemScript.toString('hex');
            
            let hex = tx.toHex();
            
            console.log("hostClaimWinSecret hex:", hex);
            BITBOX.RawTransactions.sendRawTransaction(hex).then((result) => { 
                console.log('hostClaimWinSecret txid:', result);
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

    static async hostClaimWinTimeout(wallet, betScript, betTxId, betAmount){
        return new Promise( (resolve, reject) => {

            let hostKey = BITBOX.ECPair.fromWIF(wallet.wif)
            let clientKey = BITBOX.ECPair.fromWIF(client.wif)
            let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');

            let hashType = 0xc1 // transactionBuilder.hashTypes.SIGHASH_ANYONECANPAY | transactionBuilder.hashTypes.SIGHASH_ALL
            let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2SH: 1 });
            let satoshisAfterFee = betAmount - byteCount - 800;
            transactionBuilder.addInput(betTxId, 0, bip68.encode({ blocks: 1 }))
            transactionBuilder.addOutput(wallet.utxo[0].cashAddress, satoshisAfterFee);

            let tx = transactionBuilder.transaction.buildIncomplete();

            // Sign bet tx
            let sigHash = tx.hashForWitnessV0(0, betScript, betAmount, hashType);
            let hostSig = hostKey.sign(sigHash).toScriptSignature(hashType);
            let clientSig = clientKey.sign(sigHash).toScriptSignature(hashType);

            let redeemScriptSig = []; // start by pushing with true for makeBet mode

            // host signature
            redeemScriptSig.push(hostSig.length)
            hostSig.forEach((item, index) => { redeemScriptSig.push(item); });

            // Host wins with timeout mode
            redeemScriptSig.push(0x00);
            redeemScriptSig.push(0x51);

            if (betScript.length > 75) redeemScriptSig.push(0x4c);
            redeemScriptSig.push(betScript.length);
            betScript.forEach((item, index) => { redeemScriptSig.push(item); });
            
            redeemScriptSig = Buffer(redeemScriptSig);
            tx.setInputScript(0, redeemScriptSig);
            
            // uncomment for viewing script hex
            // let redeemScriptSigHex = redeemScriptSig.toString('hex');
            // let redeemScriptHex = redeemScript.toString('hex');
            
            let hex = tx.toHex();
            
            console.log("hostClaimWinSecret hex:", hex);
            BITBOX.RawTransactions.sendRawTransaction(hex).then((result) => { 
                console.log('hostClaimWinSecret txid:', result);
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