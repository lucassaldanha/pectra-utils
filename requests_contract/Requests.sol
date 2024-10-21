// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Requests {
    address withdrawalAddress = 0x09Fc772D0857550724b07B850a4323f39112aAaA;
    address consolidationAddress = 0x01aBEa29659e5e97C95107F20bb753cD3e09bBBb;

    event RequestCreated(bool result);

    function exitValidator(bytes calldata pubkey) public {
        uint64 amount = 0;
        bytes memory data = bytes.concat(pubkey, abi.encodePacked(amount));
        (bool ret,) = withdrawalAddress.call{value: 2}(data);

        emit RequestCreated(ret);
    }

    function createPartialWithdrawal(bytes calldata pubkey, uint64 amount) public {
        bytes memory data = bytes.concat(pubkey, abi.encodePacked(amount));
        (bool ret,) = withdrawalAddress.call{value: 2}(data);

        emit RequestCreated(ret);
    }

    function updateValidatorToCompound(bytes calldata pubkey) public {
        bytes memory data = bytes.concat(pubkey, pubkey);

        (bool ret,) = consolidationAddress.call{value: 2}(data);

        emit RequestCreated(ret);
    }

    function consolidateValidators(bytes calldata sourcePubkey, bytes calldata targetPubkey) public {
        bytes memory data = bytes.concat(sourcePubkey, targetPubkey);

        (bool ret,) = consolidationAddress.call{value: 2}(data);

        emit RequestCreated(ret);
    }
}
