// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "../StakedTON.sol";

contract stTON_mock_v2 is StakedTON {
    function version() external pure returns (uint8) {
        return 2;
    }
}
