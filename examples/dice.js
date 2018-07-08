let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let fs = require('fs');
let context = require('commander');
let inquirer = require('inquirer');
let jsonfile = require('jsonfile');
let chainbet = require('../chainbet');

context
    .version('0.0.12')
    .option('-s, --selection [selection]', 'set initial menu selection')
    .option('-d, --debug [debug]', 'set debugger support (skips user prompts with default values)')
    .parse(process.argv);
context.debug = (context.debug == "1" ? true : false);
//context.cli = true;

if(!context.debug)
    main();
else if(context.debug)
    throw new Error("not implemented.");

async function main() {
    var wallet;

    // present main menu to user
    context.selection = await promptMainMenu();

    // check if wallet.json file exists
    if(fs.existsSync('./wallet.json')) {
        if (context.selection == 'generate') {
            console.log("\nGenerating a new address...");
            var wif = chainbet.Utils.getNewPrivKeyWIF();
            wallet = jsonfile.readFileSync('./wallet.json');
            wallet.push({ 'wif' : wif });
            jsonfile.writeFileSync("./wallet.json", wallet, 'utf8');
        }
    }
    else if(!fs.existsSync('./wallet.json')) {
        console.log("\nGenerating a new address and wallet.json file...");
        var wif = chainbet.Utils.getNewPrivKeyWIF();
        fs.writeFile('./wallet.json', "", 'utf8');
        jsonfile.writeFileSync("./wallet.json", [{ 'wif': wif }], 'utf8');
    }

    wallet = jsonfile.readFileSync('./wallet.json');
    context.wif = wallet[wallet.length - 1].wif;
    let ecpair = BITBOX.ECPair.fromWIF(context.wif);
    context.pubkey = BITBOX.ECPair.toPublicKey(ecpair);
    context.address = BITBOX.ECPair.toCashAddress(ecpair);
    console.log("\nYour address is: " + context.address);

    // Use chainfeed.org for OP_RETURN messages
    let chainfeed = new chainbet.MessageFeed();
    await chainfeed.checkConnection();

    // TODO: Sweep up old escrows accounts from failed bets
    // var escrows = jsonfile.readFileSync('./examples/escrows.json');
    // escrows = await chainbet.contextShared.processOldEscrows(escrows);

    // Startup a single bet workflow
    var bet;
    if (context.selection == 'host')
        bet = new chainbet.CoinFlipHost(context.wif, context.pubkey, context.address, chainfeed);
    else if (context.selection == 'client')
        bet = new chainbet.CoinFlipClient(context.wif, context.pubkey, context.address, chainfeed, context.debug);
    bet.run();

    // Create while loop to keep program alive while the asyncronous bet workflow is running.
    while (!bet.complete) {
        // do other stuff here...
        await chainbet.Utils.sleep(500);
    }

    console.log("\nContext program complete.");
    process.exit();
}

async function promptMainMenu() {

    console.log('\n-------------------------------------------------------------------------------');
    console.log("|                        Welcome to Satoshi's Dice!                           |");
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
    
    return await inquirer.prompt([{
            type: "list",
            name: "selection",
            message: "What do you want to do?",
            choices: [new inquirer.Separator("Games"),
            { name: '  Roll Dice (ODD wins) - You are Host', value: 'host' },
            { name: '  Roll Dice (EVEN wins) - You wait for a Host', value: 'client' },
            new inquirer.Separator("Tools"),
            { name: '  New BCH address', value: 'generate' },
            { name: '  Withdraw all BCH', value: 'withdraw' }
            ],
        }]);
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

    // Host mode debug (i.e., with context "-d 1 -r 1")
    if(context.selection == "host")
        wif = wallet[0].wif;
    // Host mode debug (i.e., with context "-d 1 -r 1")
    else if(context.selection == "client")
        wif = wallet[1].wif;

    context.wif = wif
    let ecpair = BITBOX.ECPair.fromWIF(wif);
    context.pubkey = BITBOX.ECPair.toPublicKey(ecpair);
    context.address = BITBOX.ECPair.toCashAddress(ecpair);

    console.log("\nYour address is: " + context.address);

    main(context);
}
