var coinflip = require('commander');
var inquirer = require('inquirer');
let jsonfile = require('jsonfile');

let chainbet = require('../chainbet');

coinflip
    .version('0.0.1')
    .option('-w, --wif [wif]', 'set WIF')
    .option('-a, --address [address]', 'set address')
    .option('-p, --pubkeyHex [pubkeyHex]', 'set pubkey')
    .option('-r, --role [role]', 'set role')
    .option('-d, --debug [debug]', 'set debugging support')
    .parse(process.argv);

// 1) save user specified args to disk
// TODO LATER

if(coinflip.debug == undefined) {
    inquirer.prompt(function() { // 1) Ask the user to specify role (Host or Client)
        var questions = [];
        if(true)
            questions.push({type: "input", name: "role", message: "Enter 1 for Host role, or 2 for Client role:"});

        return questions;
    }())

    .then(function(answers) {  // 2) if args were not specified specified, then try to load them from disk
        coinflip.role = answers.role;
        var wallet;
        if(coinflip.role == "1")
            wallet = jsonfile.readFileSync('./wallet.json')[0];
        else if(coinflip.role == "2")
            wallet = jsonfile.readFileSync('./wallet.json')[1];
         else 
            throw new Error("The input value is not either 1 or 2.");
        
        console.log("Your address is: " + wallet.address);
        
        if(coinflip.wif == undefined)
            coinflip.wif = wallet.wif;
        if(coinflip.address == undefined)
            coinflip.address = wallet.address;
        if(coinflip.pubkeyHex == undefined)
            coinflip.pubkey = Buffer(wallet.pubkeyHex, 'hex');
        else
            coinflip.pubkey = Buffer(coinflip.pubkeyHex, 'hex');
    })

    .then(function(){
        main(coinflip);
    });    
} else
    debug(coinflip);

///////////////////////////////////////////////////////////////////////////////////////////
//
// FOR DEBUGGING WITH VSCODE
//
// NOTE: The inquirer package used for user input is not compatible with the tty debugger 
//       used by visual studio code.  Therfore, the following if statement must be used
//       to allow use of the debugger.
//
///////////////////////////////////////////////////////////////////////////////////////////
async function debug(context){

    var wallet;

    // Host mode debug (i.e., with args "-d 1 -r 1")
    if(context.role == "1")
        wallet = jsonfile.readFileSync('./examples/wallet.json')[0];

    // Host mode debug (i.e., with args "-d 1 -r 1")
    else if(context.role == "2")
        wallet = jsonfile.readFileSync('./examples/wallet.json')[1];

    console.log("Your address is: " + wallet.address);
    context.wif = wallet.wif
    context.pubkey = Buffer(wallet.pubkeyHex, 'hex')
    context.address = wallet.address

    await main(context);
}

async function main(context) {
    
    var bet;
    let chainfeed = new chainbet.MessageFeed();
    await chainfeed.checkConnection();

    // Host Mode
    if (context.role == "1") {

        // create object that will manage the lifecycle of 1 coin flip bet
        bet = new chainbet.CoinFlipHost(context.wif, context.pubkey, context.address, chainfeed);
        
        // create while loop to allow other actions during bet if needed
        while (!bet.complete) {
            // do other stuff...
            await chainbet.Utils.sleep(500);
        }

    }
    // Client Mode
    else {

        // create object that will manage the lifecycle of 1 coin flip bet
        bet = new chainbet.CoinFlipClient(context.wif, context.pubkey, context.address, chainfeed);

        // create while loop to allow other actions during bet if needed
        while (!bet.complete) {
            // do other stuff...
            await chainbet.Utils.sleep(500);
        }
    }

    console.log("coinflip program complete.")
    process.exit();
}
