var coinflip = require('commander');
var inquirer = require('inquirer');
var jsonfile = require('jsonfile');

var chainbet = require('../chainbet');

coinflip
    .version('0.0.1')
    .option('-r, --role [role]', 'set role, 1=Host, 2=Client')
    .option('-d, --debug [debug]', 'set debugger support (skips user prompts with default values)')
    .option('-n, --newAddress [newAddress]', 'create a new wallet and address')
    .parse(process.argv);
coinflip.debug = (coinflip.debug == "1" ? true : false);
coinflip.cli = true;

// 1) save user specified args to disk
// TODO LATER

if(!coinflip.debug) {
    inquirer.prompt(function() { // 1) Ask the user to specify role (Host or Client)
        var questions = [];
        if(true)
            questions.push({ type: "input", 
                            name: "role", 
                            message: "Enter '1' to host a coinflip, OR Enter '2' to join a coinflip:",
                            validate: function(input){ if(input == "1" || input == "2") {return true; } else { return false; }}});
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
} else {
    debug(coinflip);
}

async function main(context) {
    
    var bet;

    // 1) start up chainfeed.org
    let chainfeed = new chainbet.MessageFeed();
    await chainfeed.checkConnection();

    // 2) try to sweep up old escrows accounts from failed bets
    // var escrows = jsonfile.readFileSync('./examples/escrows.json');
    // escrows = await chainbet.CoinFlipShared.processOldEscrows(escrows);

    // 3) startup a single bet workflow
    if (context.role == "1") // Host Mode
        bet = new chainbet.CoinFlipHost(context.wif, context.pubkey, context.address, chainfeed);
    else // Client Mode
        bet = new chainbet.CoinFlipClient(context.wif, context.pubkey, context.address, chainfeed, coinflip.cli, coinflip.debug);

    // 4) create while loop to keep program alive while the async bet workflow is running.
    while (!bet.complete) {
        // do other stuff here...
        await chainbet.Utils.sleep(500);
    }

    console.log("coinflip program complete.")
    process.exit();
}

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

    main(context);
}

