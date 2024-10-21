# Requests Contract

A sample smart contract with functions to create withdrawal and consolidation requests.

Remember that to be able to create requests for a particular validator, the validator needs to have its withdrawal credential matching the contract address.

Rough step-by-step to use the contract:
1. Deploy the contract on the network;
2. Update a validator withdrawal credentials with the contract address;
3. Interact with the contract (e.g. calling the `updateValidatorToCompound` function) to create requests!