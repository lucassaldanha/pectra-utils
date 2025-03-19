import "dotenv/config";
import { HDNodeWallet } from "ethers";

// Generates a BIP-039 + BIP-044 wallet from mnemonic deriving path
// (default = "m/44'/60'/0'/0/0") using the wordlist.

let mnemonic = process.env.VALIDATOR_MNEMONIC;

const mnemonicWallet = HDNodeWallet.fromPhrase(mnemonic);
console.log(mnemonicWallet.privateKey);