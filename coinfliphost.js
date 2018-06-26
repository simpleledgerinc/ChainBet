let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();
var inquirer = require('inquirer');

let Utils = require('./Utils');
let Core = require('./core');
let Host = require('./host');
let CoinFlipShared = require('./coinflipshared')

// CoinFlipClient class represents 1 bet's state management
module.exports = class CoinFlipHost extends Host {
    constructor(wif, pubkey, address, feed){
        super();
        this.wallet = {};
        this.wallet.wif = wif;
        this.wallet.pubkey = pubkey;
        this.wallet.address = address;

        this.betState = {};
        this.betState.phase = 1;
        this.complete = false;

        // set shared chainfeed listener (each client will periodically check for messages)
        // in future can set filter within the feed to improve performance
        this.feed = feed;

        this.run();
    }

    async run(){

        // check account balance then run bet
        if(!(await Core.checkSufficientBalance(this.wallet.address))) {
            this.complete = true;
            return;
        } 

        // Phase 0) Prompt user for bet amount & secret commitment to initiate bet.
        let answer1 = await inquirer.prompt([{type: "input", name: "amount", message: "Enter bet amount to init bet on BCH network: "}]);
        this.betState.amount = parseInt(answer1.amount);

        //let answer2 = await inquirer.prompt([{type: "input", name: "secret", message: "Choose a secret number for coinflip: "}]);
        this.betState.secret = BITBOX.Crypto.randomBytes(32); //Utils.secret_2_buf(parseInt(answer2.secret)); 
        this.betState.secretCommitment = BITBOX.Crypto.hash160(this.betState.secret);
        console.log("Your secret number is: " + parseInt(this.betState.secret.slice(0, 4).toString('hex'), 16));


        // Phase 1 -- Send out a bet announcement
        console.log('\n-----------------------------------------------------------')
        console.log('| PHASE 1: Sending coin flip bet announcement...           |')
        console.log('------------------------------------------------------------')

        this.betState.betTxId = await CoinFlipHost.sendPhase1Message(this.wallet, this.betState.amount, this.betState.secretCommitment);
        this.betState.phase = 2;
        console.log('Coinflip announcement sent. (txn id: ' + this.betState.betTxId + ')');

        // Phase 2 -- Wait for a bet client to accept...
        console.log('\n-----------------------------------------------------------');
        console.log('| PHASE 2: Waiting for someone to accept your bet...        |');
        console.log('------------------------------------------------------------');

        while(this.betState.phase == 2){

            let betId = this.betState.betTxId;

            var clientPhase2Messages = this.feed.messages.filter(function(item){ 
                if(item.phase == 2){
                    if(item.betTxId.toString('hex') == betId){ return true; }
                } 
                return false;
            });

            if(clientPhase2Messages.length > 0){
                // ignore target address field from host for now...
                // accept first bet detected
                let bet = clientPhase2Messages[clientPhase2Messages.length-1];
                this.betState.clientTxId = bet.op_return_txnId;
                this.betState.clientmultisigPubKey = bet.multisigPubKey;
                this.betState.clientCommitment = bet.secretCommitment;
                
                // NOTE: to simplify we will automatically accept the first bet host we see
                console.log("Someone has accepted your bet!! (txnId: " + bet.op_return_txnId + ")");
                //console.log("Client txn Id: " + this.betState.clientTxId);

                this.betState.phase = 3;
            }
            await Utils.sleep(500);
        }

        // Phase 3 -- Send Client your Escrow Details and multisig pub key so he can create escrow
        console.log('\n-----------------------------------------------------------');
        console.log("| PHASE 3: Funding the host's side of the bet...            |");
        console.log('-------------------------------------------------------------');

        let escrowBuf = CoinFlipShared.buildCoinFlipHostEscrowScript(this.wallet.pubkey, this.betState.secretCommitment, this.betState.clientmultisigPubKey);
        //console.log(BITBOX.Script.toASM(escrowBuf));
        this.wallet.utxo = await Core.getUtxoWithRetry(this.wallet.address);
        let escrowTxid = await Core.createEscrow(this.wallet, escrowBuf, this.betState.amount);
        console.log('Our Escrow Txn: ' + escrowTxid);
        await Utils.sleep(3000); // need to wait for BITBOX mempool to sync

        console.log('Sending client phase 3 message with our escrow details and multisigpub key...');
        let phase3MsgTxId = await CoinFlipHost.sendPhase3Message(this.wallet, this.betState.betTxId, this.betState.clientTxId, escrowTxid);
        console.log('Phase 3 message sent. txn: ' + phase3MsgTxId);
        this.betState.phase = 4;


        // Phase 4 -- Wait for Client's Escrow Details
        console.log('\n-----------------------------------------------------------');
        console.log('| PHASE 4: Waiting client to fund his side of bet...        |');
        console.log('-------------------------------------------------------------');

        while(this.betState.phase == 4){

            let betId = this.betState.betTxId;

            // TODO filter message for selected bet participant

            var clientPhase4Messages = this.feed.messages.filter(function(item){ 
                if(item.phase == 4) {
                    if(item.betTxId.toString('hex') == betId){ // && item.participantP2SHTxId.toString('hex') == clientId){ 
                        return true; }
                }
                return false;
            });

            if(clientPhase4Messages.length > 0) {
                // ignore target address field from host for now...
                let bet = clientPhase4Messages[clientPhase4Messages.length-1];
                this.betState.clientP2SHTxId = bet.participantP2SHTxId.toString('hex');
                this.betState.participantSig1 = Utils.unpadSig(bet.participantSig1);
                this.betState.participantSig2 = Utils.unpadSig(bet.participantSig2);

                console.log("The client has funded the bet!! (client msg txn: " + bet.op_return_txnId + ")");
                console.log("Client escrow txn: " + this.betState.clientP2SHTxId);

                this.betState.phase = 5;
            }
            await Utils.sleep(500);
        }

        // Phase 5 -- Submit Bet Transaction & try to claim it.
        console.log('\n-----------------------------------------------------------');
        console.log('|           PHASE 5: Submitting Coin flip bet...           |');
        console.log('-------------------------------------------------------------');

        let betScriptBuf = CoinFlipShared.buildCoinFlipBetScriptBuffer(this.wallet.pubkey, 
                                                                        this.betState.secretCommitment,
                                                                        this.betState.clientmultisigPubKey, 
                                                                        this.betState.clientCommitment);

        let clientEscrowBuf = CoinFlipShared.buildCoinFlipClientEscrowScript(this.wallet.pubkey, 
                                                                            this.betState.clientmultisigPubKey);

        let betTxId = await CoinFlipHost.redeemEscrowToMakeBet(this.wallet, 
                                                                this.betState.secret, 
                                                                this.betState.participantSig1,
                                                                this.betState.participantSig2,
                                                                escrowBuf, clientEscrowBuf, betScriptBuf, escrowTxid, 
                                                                this.betState.clientP2SHTxId, this.betState.amount);

        console.log("Bet Submitted! (txn id: " + betTxId  + ")");
        this.betState.phase = 6;

        // Phase 6 -- Wait for Client's Resignation if we lost.
        console.log('\n-----------------------------------------------------------');
        console.log('|          PHASE 6: Wait for Client WIN or LOSS              |');
        console.log('-------------------------------------------------------------');

        let p2sh_hash160 = BITBOX.Crypto.hash160(betScriptBuf);
        let scriptPubKey = BITBOX.Script.scriptHash.output.encode(p2sh_hash160);
        let betAddress = BITBOX.Address.fromOutputScript(scriptPubKey);

        while(this.betState.phase == 6){

            //let bobEscrowSig = CoinFlipShared.createEscrowSignature(this.wallet, this.betState.clientP2SHTxId, clientEscrowBuf, this.betState.amount, betScriptBuf);
            //let aliceEscrowSig = CoinFlipShared.createEscrowSignature(this.wallet, this.betState.hostP2SHTxId, escrowBuf, this.betState.amount, betScriptBuf);
            
            // 1) we need check for 1 of 2 events, bet txn spending by the client or client resignation.

            let betId = this.betState.betTxId;

            // TODO filter message for selected bet participant

            var clientPhase6Messages = this.feed.messages.filter(function(item){ 
                if(item.phase == 6) {
                    if(item.betTxId.toString('hex') == betId){ // && item.participantP2SHTxId.toString('hex') == clientId){ 
                        return true; }
                }
                return false;
            });

            if(clientPhase6Messages.length > 0) {
                // ignore target address field from host for now...
                let bet = clientPhase6Messages[clientPhase6Messages.length-1];
                this.betState.clientSecret = bet.secretValue;

                console.log("You WIN!! The client has resigned... (client msg txn: " + bet.op_return_txnId + ")");
                this.betState.phase = 7;
            }

            // TODO check to see if bet contract has been spent by the client
            let betDetails = await Core.getAddressDetailsWithRetry(betAddress);
            
            if((betDetails.balanceSat + betDetails.unconfirmedBalanceSat) <= 0 && betDetails.transactions.length == 2){
                console.log("You Lose... The Client has claimed their winnings...");
                return;
            }
            
            await Utils.sleep(500);
        }

        console.log('\n-----------------------------------------------------------');
        console.log('|          PHASE 7: Claiming Host Winnings...               |');
        console.log('-------------------------------------------------------------');

        let winTxnId = await CoinFlipHost.hostClaimWinSecret(this.wallet, betScriptBuf, betTxId, this.betState.amount);
        if(winTxnId.split(" ").length > 0 || winTxnId.split(":").length > 0)
        {
            console.log("We're sorry. Something terrible went wrong when trying to claim your winnings... " + winTxnId);
        } else {
            console.log("You've been paid! (txnId:" + winTxnId + ")");
        }
        
        this.complete = true;
    }

	static async sendPhase1Message(wallet, betAmount, hostCommitment, clientTargetAddress){
        let phase1Buf = this.encodePhase1Message(0x01, betAmount, hostCommitment, clientTargetAddress);
        // console.log("Phase 1 OP_RETURN (hex): " + phase1Buf.toString('hex'));
        // console.log("Phase 1 OP_RETURN (ASM): " + BITBOX.Script.toASM(phase1Buf));
        wallet.utxo = await Core.getUtxoWithRetry(wallet.address);
		let txnId = await Core.createOP_RETURN(wallet, phase1Buf);
		return txnId;
    }

    static async sendPhase3Message(wallet, betTxId, clientTxId, escrowTxId){
        let phase3Buf = this.encodePhase3(betTxId, clientTxId, escrowTxId, wallet.pubkey);
        // console.log("Phase 3 OP_RETURN (hex): " + phase3Buf.toString('hex'));
        // console.log("Phase 3 OP_RETURN (ASM): " + BITBOX.Script.toASM(phase3Buf));
        wallet.utxo = await Core.getUtxoWithRetry(wallet.address);
        let txnId = await Core.createOP_RETURN(wallet, phase3Buf);
        return txnId;
    }
    
    static async redeemEscrowToMakeBet(wallet, hostSecret, clientSig1, clientSig2, 
                                        hostRedeemScript, clientRedeemScript, betScript, 
                                        hostTxId, clientTxId, betAmount) {
        return new Promise( (resolve, reject) => {

            let hostKey = BITBOX.ECPair.fromWIF(wallet.wif)
            //let clientKey = BITBOX.ECPair.fromWIF(client.wif)
            let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');
    
            let hashType = 0xc1 // transactionBuilder.hashTypes.SIGHASH_ANYONECANPAY | transactionBuilder.hashTypes.SIGHASH_ALL
            let satoshisAfterFee = Core.purseAmount(betAmount);
            transactionBuilder.addInput(hostTxId, 0);
            transactionBuilder.addInput(clientTxId, 0);

            // Determine bet address
            let p2sh_hash160 = BITBOX.Crypto.hash160(betScript);
            let scriptPubKey = BITBOX.Script.scriptHash.output.encode(p2sh_hash160);
            let betAddress = BITBOX.Address.fromOutputScript(scriptPubKey);
            transactionBuilder.addOutput(BITBOX.Address.toLegacyAddress(betAddress), satoshisAfterFee);
    
            let tx = transactionBuilder.transaction.buildIncomplete();
    
            // Sign alices escrow
            let sigHash = tx.hashForWitnessV0(0, hostRedeemScript, betAmount, hashType);
            let hostSig = hostKey.sign(sigHash).toScriptSignature(hashType);
            //let clientSig = //clientKey.sign(sigHash).toScriptSignature(hashType);
    
            let redeemScriptSig = []; // start by pushing with true for makeBet mode
    
            // multisig off by one fix
            redeemScriptSig.push(BITBOX.Script.opcodes.OP_0);
    
            // host signature
            redeemScriptSig.push(hostSig.length);
            hostSig.forEach((item, index) => { redeemScriptSig.push(item); });
    
            // participant signature
            redeemScriptSig.push(clientSig2.length)
            clientSig2.forEach((item, index) => { redeemScriptSig.push(item); });
            
            // alice secret
            redeemScriptSig.push(hostSecret.length);
            hostSecret.forEach((item, index) => { redeemScriptSig.push(item); });
    
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
            //let clientSig2 = clientKey.sign(sigHash2).toScriptSignature(hashType);
    
            let redeemScriptSig2 = []
    
            // multisig off by one fix
            redeemScriptSig2.push(BITBOX.Script.opcodes.OP_0)
    
            // host signature
            redeemScriptSig2.push(hostSig2.length)
            hostSig2.forEach((item, index) => { redeemScriptSig2.push(item); })
    
            // participant signature
            redeemScriptSig2.push(clientSig1.length)
            clientSig1.forEach((item, index) => { redeemScriptSig2.push(item); });
    
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
            
            //console.log("Make Bet txn hex:", hex);
            BITBOX.RawTransactions.sendRawTransaction(hex).then((result) => { 
                //console.log('Redeem escrow txid:', result);
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
            transactionBuilder.addOutput(BITBOX.Address.toLegacyAddress(wallet.utxo[0].cashAddress), satoshisAfterFee);

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
            transactionBuilder.addOutput(BITBOX.Address.toLegacyAddress(wallet.utxo[0].cashAddress), satoshisAfterFee);

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