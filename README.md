# Pectra Utils

## Setup

A few operations (e.g. BlsToExecutionChange and Create Deposit) need a binary from https://github.com/ethereum/staking-deposit-cli/releases. Make sure you download the version that matches your system. The `deposit` version in this repo is a special version buily for Mac arm processors from [ethstaker-deposit-cli](https://github.com/eth-educators/ethstaker-deposit-cli/releases). Please make sure its permissions are updated so the script is executable.

You also need node v20+ and npm. Before using the project, run `npm install`.

If you are planning on creating voluntary exits, you need Teku to be able to use `teku voluntary-exit` command.

## .env file

The `.env` file in the root of the project has some global variables used by the helper scripts. Some of them need to be updated whenever a new network is started (e.g. `BEACON_API_ENDPOINT` and `JSON_RPC_ENDPOINT`). Others are a bit less volatile and only need to change depending on specific conditions (e.g. `GENESIS_VALIDATORS_ROOT`) only needs to change if the number of validators in the kurtosis config `pectra.yml` is updated.

## pectra.yml file

A Kurtosis configuration file `pectra.yml` is provided to make things easier. It will start a local test network with 1 CL (Teku) and 1 EL (Geth).

To start the network:
```
kurtosis run --enclave pectra github.com/ethpandaops/ethereum-package --args-file pectra.yml --image-download always
```

## Keys and Accounts

Validator Accouts Mnemonic: `giant issue aisle success illegal bike spike question tent bar rely arctic volcano long crawl hungry vocal artwork sniff fantasy very lucky have athlete`

A few prefunded accounts (find more in the output from Kurtosis)

| address                                    | private_key                                                      |
| ------------------------------------------ | ---------------------------------------------------------------- |
| 0x8943545177806ED17B9F23F0a21ee5948eCaa776 | bcdf20249abf0ed6d944c0288fad489e33f66b3960d9e6229c1cd214ed3bbe31 |
| 0xE25583099BA105D9ec0A67f5Ae86D90e50036425 | 39725efee3fb28614de3bacaffe4cc4bd8c436257e2c8bb887c4b5c4be45e76d |
| 0x614561D2d143621E126e87831AEF287678B442b8 | 53321db7c1e331d93a11a41d16f004d7ff63972ec8ec7c25db329728ceeb1710 |
| 0xf93Ee4Cf8c6c40b329b0c0626F28333c132CF241 | ab63b23eb7941c1251757e24b3d2350d2bc05c3c388d06f8fe6feafefb1e8c70 |
| 0x802dCbE1B1A97554B4F50DB5119E37E8e7336417 | 5d2344259f42259f82d2c140aa66102ba89b57b4883ee441a8b312622bd42491 |

## System Smart Contracts

- Deposit Contract Address: 0x4242424242424242424242424242424242424242
- Withdrawal Contract Address: 0x09Fc772D0857550724b07B850a4323f39112aAaA
- Consolidation Contract Address: 0x01aBEa29659e5e97C95107F20bb753cD3e09bBBb

# Helpers

## Teku Beacon API Swagger UI

Open http://127.0.0.1:50898/swagger-ui, using the correct port (check kurtosis output)

## Change Teku Log Level

Use this command to enable debug log for BlockProcessorElectra (helps to see what happens with el requests)

```
curl --location --request PUT 'http://localhost:5051/teku/v1/admin/log_level' \
--header 'Content-Type: application/json' \
--data '{
  "level": "DEBUG",
  "log_filter": [
    "tech.pegasys.teku.spec.logic.versions.electra.block.BlockProcessorElectra"
  ]
}'
```

## Smart Contract to create Requests

`requests_contract/Requests.sol` is a sample contract to show how smart contracts can be used to create requests.

# How To

## Voluntary Exit Validators

Before creating a voluntary exit, you need to download the keys and secret file from the container that is running the validator that you want to exit.

For example:

For key file = `teku-keys/0x81093820fe0770a18a816945494db8fd957f10f7693da18f782e0968ef28ea8f23afefb0dc203925262352925f2739df.json` and secret file = `teku-secrets/0x81093820fe0770a18a816945494db8fd957f10f7693da18f782e0968ef28ea8f23afefb0dc203925262352925f2739df.txt`, the command is:

```
teku voluntary-exit --beacon-node-api-endpoint=http://127.0.0.1:54290 --validator-keys="teku-keys/0x81093820fe0770a18a816945494db8fd957f10f7693da18f782e0968ef28ea8f23afefb0dc203925262352925f2739df.json:teku-secrets/0x81093820fe0770a18a816945494db8fd957f10f7693da18f782e0968ef28ea8f23afefb0dc203925262352925f2739df.txt"
```

Remember to change the port to the Beacon API.

## Generate BLS to Execution Change Messages

Command:

```
node bls_to_execution_change.js <validator_index> <bls_creds> <withdrawal_creds>
```

Example:

```
node bls_to_execution_change.js 0 0x0048281f02e108ec495e48a25d2adb4732df75bf5750c060ff31c864c053d28d 0x8943545177806ED17B9F23F0a21ee5948eCaa776
```

## Generate Deposit

First, we need to use the deposit cli to generate a deposit data file:

```
./deposit --language=english --non_interactive existing-mnemonic --chain=mainnet --mnemonic='giant issue aisle success illegal bike spike question tent bar rely arctic volcano long crawl hungry vocal artwork sniff fantasy very lucky have athlete' --validator_start_index=128 --num_validators=1 --devnet_chain_setting='{"network_name": "kurtosis", "genesis_fork_version": "0x10000038", "exit_fork_version": "0x10000038", "genesis_validator_root": "0xd1ec305b97bf6336571c2348e4a8bf173684b0cdb7e55f7e6554d51f8478b5a3"}'
```

The process will create a file like `./validator_keys/validator_keys/deposit_data-1729388794.json` (timestamp will change).

Next, we run the script that will read that file and send the transaction to the deposit contract:

```
node deposit.js ./validator_keys/deposit_data-1729388794.json
```

## Generate Consolidation Request

There is a script `consolidation.js` that will send a transaction to the consolidation contract.

If `source_pub_key` is equal to `target_pub_key`. It will update the validator's withdrawal credentials to compounding. Otherwise, it will consolidate the source validator into target validator (source validator will exit, target validator will accumulate the balance of the source validator, while having its credentials updated to compounding in the process).

Run:

```
node consolidation.js <source_pub_key> <target_pub_key>
```

Example:

```
node consolidation.js 0xaaf6c1251e73fb600624937760fef218aace5b253bf068ed45398aeb29d821e4d2899343ddcbbe37cb3f6cf500dff26c 0xaaf6c1251e73fb600624937760fef218aace5b253bf068ed45398aeb29d821e4d2899343ddcbbe37cb3f6cf500dff26c
```

## Generate Withdrawal Request

There is a script `withdrawal.js` that will send a transaction to the withdrawal contract. The default value for amount is `0` and for unit is `gwei`.

If amount is zero, the request will create an EL triggered exit. Otherwise, it will create a partial withdrawal.

Command:

```
node withdrawal.js <pubkey> <amount> <unit>
```

Example (withdrawal 20 eth):

```
node withdrawal.js 0xaaf6c1251e73fb600624937760fef218aace5b253bf068ed45398aeb29d821e4d2899343ddcbbe37cb3f6cf500dff26c 20 ether
```