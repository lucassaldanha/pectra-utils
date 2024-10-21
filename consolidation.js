import "dotenv/config";
import readline from "readline";
import { Web3 } from "web3";
import { LegacyTransaction } from "@ethereumjs/tx";
import { toBytes, bytesToHex } from "@ethereumjs/util";
import { Common } from "@ethereumjs/common";

const web3 = new Web3(
  new Web3.providers.HttpProvider(process.env.JSON_RPC_ENDPOINT)
);
const consolidationContractAddress = process.env.CONSOLIDATION_CONTRACT_ADDRESS;
const senderAccount = process.env.ETH1_ADDRESS;
const senderPrivateKey = process.env.ETH1_PRIVATE_KEY;

// If source = target, then it will update credentials to 0x2
const argv = process.argv.slice(2);
const DEFAULT_SOURCE_PUBKEY =
  "0xaaf6c1251e73fb600624937760fef218aace5b253bf068ed45398aeb29d821e4d2899343ddcbbe37cb3f6cf500dff26c";
const SOURCE_PUB_KEY = argv[0] || DEFAULT_SOURCE_PUBKEY;
const DEFAULT_TARGET_PUBKEY =
  "0xaaf6c1251e73fb600624937760fef218aace5b253bf068ed45398aeb29d821e4d2899343ddcbbe37cb3f6cf500dff26c";
const TARGET_PUB_KEY = argv[1] || DEFAULT_TARGET_PUBKEY;

const isCompoundingUpdate = SOURCE_PUB_KEY === TARGET_PUB_KEY;

console.log(`\nCreating ${isCompoundingUpdate ? "compounding credentials update" : "validator consolidation"} request:\n\tsource_pubkey = ${SOURCE_PUB_KEY}\n\ttarget_pubkey = ${TARGET_PUB_KEY}\n`);

await askQuestion(
  `Ready to submit tx to consolidation contract (${consolidationContractAddress})? Press enter to continue...\n`
);

const nonce = await web3.eth.getTransactionCount(senderAccount);

const rawTxn = {
  nonce: nonce,
  gasPrice: "0x3b9aca00",
  gasLimit: 1000000,
  to: consolidationContractAddress,
  value: 2,
  data: "0x" + SOURCE_PUB_KEY.substring(2) + TARGET_PUB_KEY.substring(2),
};

const common = Common.custom({
  chainId: process.env.NETWORK_ID,
  networkId: process.env.NETWORK_ID,
});
const tx = LegacyTransaction.fromTxData(rawTxn, { common });

const signedTx = tx.sign(toBytes(senderPrivateKey));
console.log("Transaction hash = " + bytesToHex(signedTx.hash()));

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