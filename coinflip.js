var coinflip = require('commander');
var inquirer = require('inquirer');
let chainbet = require('chainbet');

coinflip
  .version('0.0.1')
  .option('-w, --wif [wif]', 'set WIF')
  .option('-a, --address [address]', 'set address')
  .option('-p, --pubkey [pubkey]', 'set pubkey')
  .parse(process.argv);

// 1) save args to disk
// TODO LATER

// 2) if args were not specified specified, then try to load them from disk
// TODO LATER

// 3) Prompt user with questions.
inquirer.prompt(function() {
    questions = [];
    if(coinflip.wif == undefined){
        questions.push({type: "input", name:"coinflip.wif", message:"Provide WIF:"});
    }
    if(coinflip.address == undefined){
        questions.push({type: "input", name:"coinflip.address", message:"Provide Address:"});
    }
    if(coinflip.pubkey == undefined){
        questions.push({type: "input", name:"coinflip.pubkey", message:"Provide Public Key:"});
    }
    questions.push({type: "input", name: "coinflip.role", message: "Enter 1 for Host role, or 2 for Client role:"});
    return questions;
}())

// 4) ask user which role he/she would like to play (Host or Client)?
.then(function (answers) {
    if(answers.coinflip.wif != undefined){
        coinflip.wif = answers.coinflip.wif;
    }
    if(answers.coinflip.address != undefined){
        coinflip.address = answers.coinflip.address;
    }
    if(answers.coinflip.pubkey != undefined){
        coinflip.pubkey = answers.coinflip.pubkey;
    }
    coinflip.role = Number.parseInt(answers.coinflip.role);
})

// 5) depending on which role user choses launch into that mode...
.then(() => {
    if(coinflip.role == 1){
        chainbet.hostCoinflip(coinflip.wif, coinflip.pubkey, coinflip.address);
    } else {
        chainbet.joinCoinflip(coinflip.wif, coinflip.pubkey, coinflip.address);
    }
    console.log("coinflip program exited."); 
});
