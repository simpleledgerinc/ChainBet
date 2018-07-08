let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let fs = require('fs');
let coinflip = require('commander');
let inquirer = require('inquirer');
let jsonfile = require('jsonfile');
let chainbet = require('../chainbet');

coinflip
    .version('0.0.12')
    .option('-s, --selection [selection]', 'set initial menu selection')
    .option('-d, --debug [debug]', 'set debugger support (skips user prompts with default values)')
    .parse(process.argv);
coinflip.debug = (coinflip.debug == "1" ? true : false);
coinflip.cli = true;

// 1) save user specified args to disk
// TODO LATER

console.log('\n-------------------------------------------------------------------------------');
console.log('|                        Welcome to Satoshi Dice!                             |');
console.log('-------------------------------------------------------------------------------');
console.log('    =====                   .-------.    ______                       =====');
console.log('     ///                   /   o   /|   /\\     \\                       ///');
console.log('     ///                  /_______/o|  /o \\  o  \\                      ///');
console.log('     ///                  | o     | | /   o\\_____\\                     ///');
console.log('     ///                  |   o   |o/ \\o   /o    /                     ///');
console.log('     ///                  |     o |/   \\ o/  o  /                      ///');
console.log("    =====                 '-------'     \\/____o/                      =====");
console.log('-------------------------------------------------------------------------------');
console.log("|                      P2P Gaming with Bitcoin Cash                           |");
console.log('-------------------------------------------------------------------------------\n');

if(!coinflip.debug) {
    inquirer.prompt(function() { // 1) Ask the user to specify role (Host or Client)
        var questions = [];
        if(true)
            questions.push({ 
                type: "list", 
                name: "selection", 
                message: "What do you want to do?",
                choices: 
                [
                    new inquirer.Separator("Games"),
                    { name: '  Play Even-Odd as Host (ODD wins)', value: 'host' }, 
                    { name: '  Play Even-Odd as Client (EVEN wins)', value: 'client' }, 
                    new inquirer.Separator("Tools"),
                    { name: '  Generate new address', value: 'generate' }, 
                    { name: '  Withdraw funds', value: 'withdraw' }
                ],
            });
        return questions;
    }())

    .then(function(answers) {
        coinflip.selection = answers.selection;
        var wallet, wif;

        if(fs.existsSync('./wallet.json')) {
            switch (answers.selection) {
                case 'generate':
                    console.log("\nGenerating a new address...");
                    wif = chainbet.Utils.getNewPrivKeyWIF();
                    wallet = jsonfile.readFileSync('./wallet.json');
                    wallet.push({ 'wif' : wif });
                    jsonfile.writeFileSync("./wallet.json", wallet, 'utf8');
                    break;
                default:
                    break;
            }
        }
        else {
            console.log("\nGenerating a new address and wallet.json file...");
            wif = chainbet.Utils.getNewPrivKeyWIF();
            fs.writeFile('./wallet.json', "", 'utf8');
            jsonfile.writeFileSync("./wallet.json", [{ 'wif': wif }], 'utf8');
        }

        wallet = jsonfile.readFileSync('./wallet.json');
        wif = wallet[wallet.length - 1].wif;
                
        if(coinflip.wif == undefined) {
            coinflip.wif = wif;
        }

        let ecpair = BITBOX.ECPair.fromWIF(coinflip.wif);
        coinflip.pubkey = BITBOX.ECPair.toPublicKey(ecpair);
        coinflip.address = BITBOX.ECPair.toCashAddress(ecpair);

        console.log("\nYour address is: " + coinflip.address);
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
    if (context.selection == 'host') {
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

    var wallet = jsonfile.readFileSync('./examples/wallet.json');
    var wif; 

    // Host mode debug (i.e., with args "-d 1 -r 1")
    if(context.selection == "host")
        wif = wallet[0].wif;
    // Host mode debug (i.e., with args "-d 1 -r 1")
    else if(context.selection == "client")
        wif = wallet[1].wif;

    context.wif = wif
    let ecpair = BITBOX.ECPair.fromWIF(wif);
    context.pubkey = BITBOX.ECPair.toPublicKey(ecpair);
    context.address = BITBOX.ECPair.toCashAddress(ecpair);

    console.log("\nYour address is: " + context.address);

    main(context);
}
