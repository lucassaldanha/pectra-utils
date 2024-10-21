import "dotenv/config";
import readline from "readline";
import { Web3 } from "web3";
import { LegacyTransaction } from "@ethereumjs/tx";
import { toBytes, bytesToHex } from "@ethereumjs/util";
import { Common, Hardfork } from "@ethereumjs/common";

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.JSON_RPC_ENDPOINT));

const withdrawalContractAddress = process.env.WITHDRAWAL_CONTRACT_ADDRESS;
const senderAccount = process.env.ETH1_ADDRESS;
const senderPrivateKey = process.env.ETH1_PRIVATE_KEY;

const argv = process.argv.slice(2);
const DEFAULT_VALIDATOR_PUBKEY =
  "0xaaf6c1251e73fb600624937760fef218aace5b253bf068ed45398aeb29d821e4d2899343ddcbbe37cb3f6cf500dff26c";
const VALIDATOR_PUB_KEY = argv[0] || DEFAULT_VALIDATOR_PUBKEY;

const DEFAULT_AMOUNT = 0;
const AMOUNT = Number(argv[1]) || DEFAULT_AMOUNT;

const DEFAULT_UNIT = "gwei";
const UNIT = argv[2] || DEFAULT_UNIT;

// Encode value in gwei
let encodedAmount;
if (AMOUNT > 0) {
  const valueInWei = web3.utils.toWei(AMOUNT, UNIT);
  const valueInGwei = web3.utils.fromWei(valueInWei, "gwei");
  const gweiValueInHex = web3.utils.numberToHex(valueInGwei);
  encodedAmount = web3.utils.encodePacked({ value: gweiValueInHex, type: `uint64` }).slice(2);
} else {
  encodedAmount = web3.utils.encodePacked({ value: 0, type: `uint64` }).slice(2);
}
const isExit = AMOUNT === 0;

console.log(`\nCreating ${isExit ? 'full' : 'partial'} withdrawal request${isExit ? " (exit)" : ""}:\n\tpubkey = ${VALIDATOR_PUB_KEY}\n\tamount = ${AMOUNT} ${UNIT}\n`);

await askQuestion(
  `Ready to submit tx to withdrawal contract (${withdrawalContractAddress})? Press enter to continue...\n`
);

const nonce = await web3.eth.getTransactionCount(senderAccount);

const rawTxn = {
  nonce: nonce,
  gasPrice: "0x3b9aca00",
  gasLimit: 1000000,
  to: withdrawalContractAddress,
  value: 2,
  data: VALIDATOR_PUB_KEY + encodedAmount,
};

const common = Common.custom({ chainId: process.env.NETWORK_ID, networkId: process.env.NETWORK_ID})
const tx = LegacyTransaction.fromTxData(rawTxn, { common });

const signedTx = tx.sign(toBytes(senderPrivateKey));
console.log("Transaction hash = " + bytesToHex(signedTx.hash()));

try {
  await web3.eth.sendSignedTransaction(bytesToHex(signedTx.serialize()))
} catch (err) {
  console.error(err)
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
