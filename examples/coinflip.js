var coinflip = require('commander');
var inquirer = require('inquirer');
var jsonfile = require('jsonfile');

var chainbet = require('../chainbet');

coinflip
    .version('0.0.1')
    .option('-r, --role [role]', 'set role')
    .option('-d, --debug [debug]', 'set debugger support (skips user prompts with default values)')
    .option('-n, --newAddress [newAddress]', 'create a new wallet and address')
    .parse(process.argv);
coinflip.debug = (coinflip.debug == "1" ? true : false);
coinflip.cli = true;

// 1) save user specified args to disk
// TODO LATER

console.log('\n-------------------------------------------------------------------------------');
console.log('|                        Welcome to Satoshi Dice!                             |');
console.log('-------------------------------------------------------------------------------');
console.log('=====                       .-------.    ______                           =====');
console.log(' ///                       /   o   /|   /\\     \\                           ///');
console.log(' ///                      /_______/o|  /o \\  o  \\                          ///');
console.log(' ///                      | o     | | /   o\\_____\\                         ///');
console.log(' ///                      |   o   |o/ \\o   /o    /                         ///');
console.log(' ///                      |     o |/   \\ o/  o  /                          ///');
console.log("=====                     '-------'     \\/____o/                          =====");
console.log('-------------------------------------------------------------------------------');
console.log("|                      P2P Gaming with Bitcoin Cash                           |");
console.log('-------------------------------------------------------------------------------\n');

if(!coinflip.debug) {
    inquirer.prompt(function() { // 1) Ask the user to specify role (Host or Client)
        var questions = [];
        if(true)
            questions.push({ 
                            type: "list", 
                            name: "role", 
                            message: "What do you want to do?",
                            choices: [new inquirer.Separator("Games"),
                                        { name: 'Play Even-Odd as Host (ODD wins)', value: 'host' }, 
                                        { name:'Play Even-Odd as Client (EVEN wins)', value: 'client' }, 
                                        new inquirer.Separator("Tools"),
                                        { name: 'Import new private key', value: 'import' }, 
                                        { name: 'Withdraw funds', value: 'withdraw' },
                                        { name: 'Pre-split coins', value: 'split' }
                                    ],
                        });
        return questions;
    }())

    .then(function(answers) {  // 2) if args were not specified specified, then try to load them from disk
        coinflip.role = answers.role;
        var wallet;
        if(coinflip.role == 'host')
            wallet = jsonfile.readFileSync('./wallet.json')[0];
        else if(coinflip.role == 'client')
            wallet = jsonfile.readFileSync('./wallet.json')[1];
         else 
            throw new Error("Not a valid selection.");
        
        console.log("\nYour address is: " + wallet.address);
        
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
    if (context.role == 'host') {
        // Host Mode
        bet = new chainbet.CoinFlipHost(context.wif, context.pubkey, context.address, chainfeed);
        bet.run();
    } else { 
        // Client Mode
        bet = new chainbet.CoinFlipClient(context.wif, context.pubkey, context.address, chainfeed, coinflip.debug);
        bet.run();
    }  

    // 4) create while loop to keep program alive while the async bet workflow is running.
    while (!bet.complete) {
        // do other stuff here...
        await chainbet.Utils.sleep(500);
    }

    console.log("\ncoinflip program complete.")
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
    if(context.role == "host")
        wallet = jsonfile.readFileSync('./examples/wallet.json')[0];

    // Host mode debug (i.e., with args "-d 1 -r 1")
    else if(context.role == "client")
        wallet = jsonfile.readFileSync('./examples/wallet.json')[1];

    console.log("\nYour address is: " + wallet.address);
    context.wif = wallet.wif
    context.pubkey = Buffer(wallet.pubkeyHex, 'hex')
    context.address = wallet.address

    main(context);
}

