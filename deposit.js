import "dotenv/config";
import readline from "readline";
import fs from "fs";
import { exec } from "child_process";
import { Web3 } from "web3";
import { LegacyTransaction } from "@ethereumjs/tx";
import { toBytes, bytesToHex } from "@ethereumjs/util";
import { Common } from "@ethereumjs/common";
import depositContractABI from "./deposit_contract/depositContractABI.json" with { type: "json" };

const web3 = new Web3(
  new Web3.providers.HttpProvider(process.env.JSON_RPC_ENDPOINT)
);

const argv = process.argv.slice(2);
const DEPOSIT_DATA_FILE = argv[0];

const depositContractAddress = process.env.DEPOSIT_CONTRACT_ADDRESS;
const senderAccount = process.env.ETH1_ADDRESS;
const senderPrivateKey = process.env.ETH1_PRIVATE_KEY;

// Read deposit data file
const depositData = JSON.parse(fs.readFileSync(`${DEPOSIT_DATA_FILE}`, "utf8"))[0];
const publicKey = "0x" + depositData.pubkey;
const withdrawalCredentials = "0x" + depositData.withdrawal_credentials;
const signature = "0x" + depositData.signature;
const dataRoot = "0x" + depositData.deposit_data_root;
const amountInGwei = depositData.amount

const depositContract = new web3.eth.Contract(depositContractABI, depositContractAddress);
const encodedParams = await depositContract.methods.deposit(publicKey, withdrawalCredentials, signature, dataRoot).encodeABI();
const amount = web3.utils.numberToHex(web3.utils.toWei(amountInGwei, 'gwei'));

console.log(`\nParsed deposit data from file (${DEPOSIT_DATA_FILE}):\n\tpublicKey = ${publicKey}\n\twithdrawal_creds = ${withdrawalCredentials}\n\tamount = ${amountInGwei}\n`);

await askQuestion(
  `Ready to submit tx to deposit contract (${depositContractAddress})? Press enter to continue...\n`
);

const nonce = await web3.eth.getTransactionCount(senderAccount);

const rawTxn = {
  nonce: nonce,
  gasPrice: "0xffffff",
  gasLimit: 2000000,
  to: depositContractAddress,
  value: amount,
  data: encodedParams,
};

const common = Common.custom({
  chainId: process.env.NETWORK_ID,
  networkId: process.env.NETWORK_ID,
});
const tx = LegacyTransaction.fromTxData(rawTxn, { common });

const signedTx = tx.sign(toBytes(senderPrivateKey));
console.log("Transaction hash: " + bytesToHex(signedTx.hash()));

try {
  await web3.eth.sendSignedTransaction(bytesToHex(signedTx.serialize()));
} catch (err) {
  console.error(err);
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}