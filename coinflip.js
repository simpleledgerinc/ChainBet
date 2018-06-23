var coinflip = require('commander');
var inquirer = require('inquirer');
let jsonfile = require('jsonfile')

let chainbet = require('./chainbet');

coinflip
  .version('0.0.1')
  .option('-w, --wif [wif]', 'set WIF')
  .option('-a, --address [address]', 'set address')
  .option('-p, --pubkeyHex [pubkeyHex]', 'set pubkey')
  .option('-m, --mode [mode]', 'set mode')
  .parse(process.argv);

// 1) save user specified args to disk
// TODO LATER

// 2) if args were not specified specified, then try to load them from disk
let file = jsonfile.readFileSync('./test/wallet.json');
if(coinflip.wif == undefined){
    coinflip.wif = file.wif;
}
if(coinflip.address == undefined){
    coinflip.address = file.address;
}
if(coinflip.pubkeyHex == undefined){
    coinflip.pubkey = Buffer(file.pubkeyHex, 'hex')
}
else{
    coinflip.pubkey = Buffer(coinflip.pubkeyHex, 'hex')
}

// 3) if not on disk Prompt user with questions.
inquirer.prompt(function() {
    questions = [];
    if(coinflip.wif == undefined || coinflip.wif == ""){
        questions.push({type: "input", name:"wif", message:"Provide WIF:"});
    }
    if(coinflip.address == undefined || coinflip.address == ""){
        questions.push({type: "input", name:"address", message:"Provide Address:"});
    }
    if(coinflip.pubkey == undefined || coinflip.pubkey == ""){
        questions.push({type: "input", name:"pubkeyHex", message:"Provide Compressed Public Key:"});
    }
    if(coinflip.mode == undefined){
        questions.push({type: "input", name: "role", message: "Enter 1 for Host role, or 2 for Client role:"});
    }
    return questions;
}())

// 4) set state variables based on answered questions
.then(function (answers) {
    if(answers.wif != undefined){
        coinflip.wif = answers.wif;
        // todo: save to disk
    }
    if(answers.address != undefined){
        coinflip.address = answers.address;
        // todo: save to disk
    }
    if(answers.pubkeyHex != undefined){
        coinflip.pubkey = Buffer(answers.pubkeyHex, 'hex');
        // todo: save to disk
    }
    coinflip.role = Number.parseInt(answers.role);
})

// 5) depending on which role user choses launch into that mode...
.then(async () => {

    var bet;
    let chainfeed = new chainbet.MessageFeed();
    await chainfeed.checkConnection();

    if(coinflip.role == 1){ // Host Mode
        
        // create object that will manage the lifecycle of 1 coin flip bet
        bet = new chainbet.CoinFlipHost(coinflip.wif, coinflip.pubkey, coinflip.address, chainfeed);

        // create while loop to keep program alive, and allow user interaction when needed
        while(bet.phase != 7){
            //chainbet.CoinFlipHost.checkForUserInput(bet);
            await chainbet.Utils.sleep(500);
        }

    } else { // Client Mode

        // create object that will manage the lifecycle of 1 coin flip bet
        bet = new chainbet.CoinFlipClient(coinflip.wif, coinflip.pubkey, coinflip.address, chainfeed);

        // create while loop to keep program alive, and allow user interaction when needed
        while(bet.phase != 7){
            //chainbet.CoinFlipClient.checkForUserInput(bet);
            await chainbet.Utils.sleep(500);
        }
    }

    console.log("coinflip program exited."); 
});

module.exports = class CoinFlip {

    

}