let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let Utils = require('./utils')

module.exports = class Core {
	
	static async getUtxo(address) {
		return new Promise( (resolve, reject) => {
			BITBOX.Address.utxo(address).then((result) => { 
				resolve(result)
			}, (err) => { 
				console.log(err)
				reject(err)
			})
		})
	}

	static decodePhaseData(buf, networkByte=0x00) {

		// convert op_return buffer to hex string
		//op_return = op_return.toString('hex');

		// split the op_return payload and get relavant data
		//let data = op_return.split("04004245544c"); // pushdata (0x04) + Terab ID + pushdata (0x4c)
		//let buf = Buffer.from(data[0].trim(), 'hex');  // NOTE: the index of data was changed to 0 due to MessageFeed listen method.

		// grab the common fields
		let version = buf[0];
		let phase = buf[1];
		let results = { version: version, phase: phase };

		// Phase 1 specific fields
		if(phase === 0x01) {
			// Bet Type
			results.type = buf[2];
			// Bet Amount
			results.amount = parseInt(buf.slice(3,11).toString('hex'), 16);
			// Host commitment
			results.hostCommitment = buf.slice(11,31);

			// Target address (as hash160 without network or sha256)
			if (buf.length > 31){ 
				var pkHash160Hex = buf.slice(31).toString('Hex');
				results.address = Utils.hash160_2_cashAddr(pkHash160Hex, networkByte);
			}
		// Phase 2 specific fields
		} else if(phase === 0x02) {
			// Bet Txn Id
			results.betTxId = buf.slice(2, 34);
			// 33 byte Multi-sig Pub Key
			results.multisigPubKey = buf.slice(34,67);
			// 20 byte bob commitment
			results.secretCommitment = buf.slice(67);

		// Phase 3  specific fields
		} else if(phase === 0x03) {
			// 32 byte Bet Txn Id
			results.betTxId = buf.slice(2, 34);
			// 32 byte Participant Txn Id
			results.participantOpReturnTxId = buf.slice(34, 66);
			// 32 byte Host P2SH txid
			results.hostP2SHTxId = buf.slice(66, 98);
			// 33 byte Host (Alice) multsig pubkey
			results.hostMultisigPubKey = buf.slice(98);

		//Phase 4 specific fields
		} else if(phase === 0x04) {
			// 32 byte Bet Txn Id
			results.betTxId = buf.slice(2, 34);
			// 32 byte Participant Txn Id
			results.participantP2SHTxId = buf.slice(34, 66);
			// 72 byte Participant Signature 1
			results.participantSig1 = buf.slice(66, 138);
			// 72 byte Participant Signature 2
			results.participantSig2 = buf.slice(138);

		// Phase 6 specific fields
		} else if(phase === 0x06) {
			// 32 byte Bet Txn Id
			results.betTxId = buf.slice(2, 34)
			// 32 byte Secret Value
			results.secretValue = buf.slice(34, 66);
		}

		return results;
	}

	static async createOP_RETURN(wallet, op_return_buf) {
		
		// THIS MAY BE BUGGY TO HAVE THIS HERE
		//wallet.utxo = await this.getUtxo(wallet.address);
		
		return new Promise((resolve, reject) => {
			let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');
			let hashType = transactionBuilder.hashTypes.SIGHASH_ALL;
	
			let totalUtxo = 0;
			wallet.utxo.forEach((item, index) => { 
				transactionBuilder.addInput(item.txid, item.vout); 
				totalUtxo += item.satoshis;
			});
	
			let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: wallet.utxo.length }, { P2SH: 0 }) + op_return_buf.length + 1000;
			let satoshisAfterFee = totalUtxo - byteCount
	
			transactionBuilder.addOutput(op_return_buf, 0);        				        // OP_RETURN Message 
			transactionBuilder.addOutput(wallet.utxo[0].cashAddress, satoshisAfterFee); // Change 
			//console.log("txn fee: " + byteCount);
			//console.log("satoshis left: " + satoshisAfterFee);
			let key = BITBOX.ECPair.fromWIF(wallet.wif);

			let redeemScript;
			wallet.utxo.forEach((item, index) => {
				transactionBuilder.sign(index, key, redeemScript, hashType, item.satoshis);
			});

			let hex = transactionBuilder.build().toHex();

			//console.log("Create op_return message hex:", hex);

			BITBOX.RawTransactions.sendRawTransaction(hex).then((result) => { 
				//console.log("OP_RETURN RESULT: " + result)
				//console.log('Create op_return txid:', result);
				if (result.length < 60) { // Very rough txid size check for failure
					console.log(result);
					reject("txid too small");
				}
				else {
					resolve(result);
				}
			}, (err) => { 
				console.log("ERROR: " + err);
				reject(err);
			});
		});
	}

	static async createEscrow(wallet, script, betAmount){
		
		return new Promise( (resolve, reject) => {
			let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');
			let hashType = transactionBuilder.hashTypes.SIGHASH_ALL | transactionBuilder.hashTypes.SIGHASH_ANYONECANPAY;
	
			let totalUtxo = 0;
			wallet.utxo.forEach((item, index) => { 
				transactionBuilder.addInput(item.txid, item.vout); 
				totalUtxo += item.satoshis;
			});
	
			let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: wallet.utxo.length }, { P2SH: 1 }) + 50;
			let satoshisAfterFee = totalUtxo - byteCount - betAmount
	
			let p2sh_hash160 = BITBOX.Crypto.hash160(script);
			let p2sh_hash160_hex = p2sh_hash160.toString('hex');
			let scriptPubKey = BITBOX.Script.scriptHash.output.encode(p2sh_hash160);

			let address = BITBOX.Address.toLegacyAddress(BITBOX.Address.fromOutputScript(scriptPubKey));
			// console.log("escrow address: " + address);
			// console.log("change satoshi: " + satoshisAfterFee);
			// console.log("change bet amount: " + betAmount);

			transactionBuilder.addOutput(address, betAmount);
			transactionBuilder.addOutput(wallet.utxo[0].cashAddress, satoshisAfterFee);
			//console.log("Added escrow outputs...");

			let key = BITBOX.ECPair.fromWIF(wallet.wif);
	
			let redeemScript;
			wallet.utxo.forEach((item, index) => {
				transactionBuilder.sign(index, key, redeemScript, hashType, item.satoshis);
			});
			//console.log("signed escrow inputs...");

			let hex = transactionBuilder.build().toHex();
			//console.log("built escrow...");

			//console.log("Escrow hex:", hex);
			BITBOX.RawTransactions.sendRawTransaction(hex).then((result) => { 
				//console.log('Escrow txid:', result);
				if (result.length < 60){ // Very rough txid size check for failure
					console.log(result);
					reject("txid too small");
				}
				else {
					resolve(result);
				}
			}, (err) => { 
				console.log(err);
				reject(err);
			});
		});
    }
    
    static async redeemEscrowToEscape(wallet, redeemScript, txid, betAmount){
        
        return new Promise( (resolve, reject) => {
    
            let hostKey = BITBOX.ECPair.fromWIF(wallet.wif)
            let participantKey = BITBOX.ECPair.fromWIF(client.wif)
            let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');
    
            let hashType = 0xc1 // transactionBuilder.hashTypes.SIGHASH_ANYONECANPAY | transactionBuilder.hashTypes.SIGHASH_ALL
            let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2SH: 1 });
            let satoshisAfterFee = betAmount - byteCount - 350;
            // NOTE: must set the Sequence number below
            transactionBuilder.addInput(txid, 0, bip68.encode({ blocks: 1 })); // No need to worry about sweeping the P2SH address.      
            transactionBuilder.addOutput(wallet.utxo[0].cashAddress, satoshisAfterFee);
    
            let tx = transactionBuilder.transaction.buildIncomplete();
    
            let signatureHash = tx.hashForWitnessV0(0, redeemScript, betAmount, hashType);
            let hostSignature = hostKey.sign(signatureHash).toScriptSignature(hashType);
            let participantSignature = participantKey.sign(signatureHash).toScriptSignature(hashType);
    
            let redeemScriptSig = []; // start by pushing with true for makeBet mode
    
            // host signature
            redeemScriptSig.push(hostSignature.length);
            hostSignature.forEach((item, index) => { redeemScriptSig.push(item); });
    
            // push mode onto stack for MakeBet mode
            redeemScriptSig.push(0x00); //use 0 for escape mode
    
            if (redeemScript.length > 75) redeemScriptSig.push(0x4c);
            redeemScriptSig.push(redeemScript.length);
            redeemScript.forEach((item, index) => { redeemScriptSig.push(item); });
            
            redeemScriptSig = Buffer(redeemScriptSig);
            
            let redeemScriptSigHex = redeemScriptSig.toString('hex');
            let redeemScriptHex = redeemScript.toString('hex');
            
            tx.setInputScript(0, redeemScriptSig);
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
	
	static buildCoinFlipBetScriptBuffer(hostPubKey, hostCommitment, clientPubKey, clientCommitment){
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
}