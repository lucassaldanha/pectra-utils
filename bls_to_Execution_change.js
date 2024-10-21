import "dotenv/config";
import readline from "readline";
import { exec } from "child_process";
import axios from "axios";
import fs from "fs";

const URL = process.env.BEACON_API_ENDPOINT;

const argv = process.argv.slice(2);

const DEFAULT_INDEX = 0;
const INDEX = argv[0] || DEFAULT_INDEX;

const DEFAULT_BLS_CREDS =
  "0x0048281f02e108ec495e48a25d2adb4732df75bf5750c060ff31c864c053d28d";
const BLS_CREDS = argv[1] || DEFAULT_BLS_CREDS;

const DEFAULT_WITHDRAWAL_CREDS = "0x8943545177806ED17B9F23F0a21ee5948eCaa776";
const WITHDRAWAL_CREDS = argv[2] || DEFAULT_WITHDRAWAL_CREDS;

console.log(
  `\nCreating BlsToExecutionChange\n\tvalidator = ${INDEX}\n\tbls creds = ${BLS_CREDS}\n\teth1 creds = ${WITHDRAWAL_CREDS})\n`
);

try {
  await execShellCommand(
    `./deposit --language=english --non_interactive generate-bls-to-execution-change --chain=mainnet --mnemonic='${process.env.VALIDATOR_MNEMONIC}' --validator_start_index="${INDEX}" --validator_indices="${INDEX}" --bls_withdrawal_credentials_list="${BLS_CREDS}" --withdrawal_address="${WITHDRAWAL_CREDS}" --devnet_chain_setting='{"network_name": "${process.env.NETWORK_NAME}", "genesis_fork_version": "${process.env.GENESIS_FORK_VERSION}", "exit_fork_version": "${process.env.GENESIS_FORK_VERSION}", "genesis_validator_root": "${process.env.GENESIS_VALIDATORS_ROOT}"}'`
  );
} catch (err) {
  console.error(err);
  process.exit(1);
}

var signedMessage;
try {
  let file = await execShellCommand(
    "ls -1 ./bls_to_execution_changes | sort -r | head -n 1"
  );
  file = file.trim();
  console.log(`Created signed message ${file}\n`);
  signedMessage = fs.readFileSync(`bls_to_execution_changes/${file}`, "utf8");
} catch (err) {
  console.error(err);
  process.exit(1);
}

await askQuestion(
  `Ready to submit to Beacon API (${URL})? Press enter to continue...\n`
);

const headers = {
  "Content-Type": "application/json",
};
try {
  const response = await axios.post(
    URL + "/eth/v1/beacon/pool/bls_to_execution_changes",
    signedMessage,
    { headers: headers }
  );
  console.log(response.status);
} catch (error) {
  console.log(error.response);
  process.exit(1);
}

function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
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
