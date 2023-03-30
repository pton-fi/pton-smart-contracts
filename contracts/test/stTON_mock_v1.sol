// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "../stTON.sol";

contract stTON_mock_v1 is stTON {
    function version() external pure returns (uint8) {
        return 1;
    }
}
