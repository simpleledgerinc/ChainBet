let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

var chainfeed = require('./chainfeed');
var core = require('./core');
var utils = require('./utils')


module.exports = class MessageFeed {
    //clientFilters = []; <-- future
    //hostFilters = [];   <-- future

    constructor(){
        this.messages = [];
        this.feedState = { connected: false };
        this.listen();
    }

    async listen(){
        chainfeed.listen(MessageFeed.onData(this.messages), 
                            MessageFeed.onConnect(this.feedState), 
                            MessageFeed.onDisconnect(this.feedState));
    }

    async checkConnection(){
        while(!this.feedState.connected){
            console.log("[MessageFeed] Connecting...")
            await utils.sleep(500);
        }
        return
    }

    static onData(messages){ 
        return function(res){           
            
            //console.log("New transaction found in mempool! = ", res)
            
            let txs
            if (res.block)
                txs = res.reduce((prev, cur) => [...prev, ...cur], [])
            else
                txs = res
            
            for(let tx of txs) {

                if (!tx.data || !tx.data[0].buf || !tx.data[0].buf.data) return
                let protocol = Buffer.from(tx.data[0].buf.data).toString('hex').toLowerCase()
                if (protocol == '00424554') {

                    let chainbetBuf = Buffer(tx.data[1].buf.data);

                    //console.log('[MessageFeed] ChainBet Data: ' + chainbetBuf.toString('hex'));

                    let decodedBet = core.decodePhaseData(chainbetBuf);

                    decodedBet.op_return_txnId = tx.tx.hash
                    //console.log('[MessageFeed] Txn id: ' + tx.tx.hash);

                    messages.push(decodedBet);
                }
            }
        }
    }

    static onConnect(feedState){ 
        return function(e){
            feedState.connected = true;
            console.log("[MessageFeed] Connected.");
        }
    }

    static onDisconnect(feedState){
        return function(e){
            feedState.connected = false;
            console.log("[MessageFeed] Disconnected.");
        }
    }
}
