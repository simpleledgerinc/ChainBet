var chainfeed = require('chainfeed');

module.export = class MessageFeed {
    messages=[];

    //clientFilters = []; <-- future
    //hostFilters = [];   <-- future

    constructor(){
        this.listen();
    }

    listen(){
        // @SpendBCH --> copy in chainfeed server side event code here

        //NOTE:
        // When chainfeed detects a ChainBet protocol message it should simply add it to the messages array.
    }
}
