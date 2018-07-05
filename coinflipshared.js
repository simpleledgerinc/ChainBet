let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let Core = require('./core');

module.exports = class CoinFlipShared {

	static buildCoinFlipBetScriptBuffer(hostPubKey, hostCommitment, clientPubKey, clientCommitment){
		
		let script = [
			BITBOX.Script.opcodes.OP_IF,
			BITBOX.Script.opcodes.OP_IF,
			BITBOX.Script.opcodes.OP_DUP,
			BITBOX.Script.opcodes.OP_HASH160,
			clientCommitment.length
		];
		
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
			BITBOX.Script.opcodes.OP_1,
			BITBOX.Script.opcodes.OP_EQUALVERIFY,
			BITBOX.Script.opcodes.OP_ELSE,
			0x54, // use 0x54 for 4 blocks
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
	
    static buildCoinFlipHostEscrowScript(hostPubKey, hostCommitment, clientPubKey){
    
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
            0x58, // use 0x58 for 8 blocks
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
	
    static buildCoinFlipClientEscrowScript(hostPubKey, clientPubKey){
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
            0x58, // use 0x58 for 8 blocks
            BITBOX.Script.opcodes.OP_CHECKSEQUENCEVERIFY,
            BITBOX.Script.opcodes.OP_DROP,
            clientPubKey.length
        ]);
    
        clientPubKey.forEach(i => script.push(i));
        script = script.concat([
            BITBOX.Script.opcodes.OP_CHECKSIG,
            BITBOX.Script.opcodes.OP_ENDIF
        ]);
        
        return BITBOX.Script.encode(script);
	}
	
	static createEscrowSignature(wallet, escrowTxId, escrowScript, betAmount, betScript){
		let clientKey = BITBOX.ECPair.fromWIF(wallet.wif)
		let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');

		let hashType = 0xc1 // transactionBuilder.hashTypes.SIGHASH_ANYONECANPAY | transactionBuilder.hashTypes.SIGHASH_ALL
		let satoshisAfterFee = Core.purseAmount(betAmount);
		transactionBuilder.addInput(escrowTxId, 0); // No need to worry about sweeping the P2SH address.      

		// Determine bet address
		let p2sh_hash160 = BITBOX.Crypto.hash160(betScript);
		let scriptPubKey = BITBOX.Script.scriptHash.output.encode(p2sh_hash160);
		let betAddress = BITBOX.Address.fromOutputScript(scriptPubKey)
		transactionBuilder.addOutput(BITBOX.Address.toLegacyAddress(betAddress), satoshisAfterFee);

		let tx = transactionBuilder.transaction.buildIncomplete();

		// Sign escrow utxo
		let sigHash = tx.hashForWitnessV0(0, escrowScript, betAmount, hashType);
		let sig = clientKey.sign(sigHash).toScriptSignature(hashType);
		return sig;
	}
	
}