// SPDX-License-Identifier: UNLICENSED

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity ^0.8.4;

/**
 * @title  Interface for stTON token
 * @notice stTON token is fully compliant with ERC20 standard with a few extensions:
 *         It uses ERC20Permit extension from OpenZeppelin
 *         (https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Permit)
 *         It also rebases itself when an oracle notifies dividends from TON network
 *         The staking rewards distribution is linear over specified period,
 *         overlapping periods are summed up to the last period
 */
interface IstTON {
    struct RewardsInfo {
        int128 rewardRate;
        uint64 startOfRewardPeriod;
        uint64 endOfRewardPeriod;
    }

    /**
     * @notice Revert reason for unwanted input zero addresses
     */
    error ZeroAddress();

    /**
     * @notice Revert reason for transfers of underlying amount below minimal threshold
     *         Balances are stored in shares, usually making 1 share >= 1 stTON
     *         This error prevents zero transfers with non-zero input underlying amount
     *         To check current minimal transferrable amount, one should use 'minTransferAmount()' getter
     */
    error ZeroShares();

    /**
     * @notice Revert reason for burning with data without a valid TON address to bridge to
     */
    error InvalidData();

    /**
     * @notice Revert reason for minting with zeroed salt
     */
    error InvalidSalt();

    /**
     * @notice Revert reason for minting with signature parameter that was already successfully used once
     */
    error AlreadyUsedSignature();

    /**
     * @notice Revert reason for minting without validator's consensus
     */
    error ValidationFailed();

    /**
     * @notice Revert reason for too low reward period notified by the oracle
     */
    error BelowMinRewardPeriod();

    /**
     * @notice Revert reason for too high reward delta notified by the oracle
     */
    error AboveMaxRewardDelta();

    /**
     * @notice Emitted when rewards are notified by an oracle monitoring TON network
     * @param newRewardsInfo The updated RewardsInfo structure that can be read via 'rewardsInfo()'
     */
    event Rewarded(RewardsInfo newRewardsInfo);

    /**
     * @notice Emitted when a user burns tokens to be caught by a validator to bridge it back to TON network
     * @param user Address of the user whose tokens were burnt (burn with allowance is supported)
     * @param amount Amount of underlying were burnt, should be bridged 1-to-1 to TON network
     * @param data Metadata for bridge, must contain address in TON, which will receive TONs
     */
    event Burned(address indexed user, uint256 amount, bytes data);

    /**
     * @notice Emitted when tokens are successfully minted using validator's signatures
     * @param to Address of receiver taken from tx message in TON network
     * @param salt Salt signature identifying underlying transaction in TON network
     */
    event Minted(address to, bytes32 salt);

    /**
     * @notice Calculates minimal transferrable underlying amount
     *         Any transfers with amount below this minimum will be reverted with ZeroShares() error
     * @return Returns underlying value for 1 share: totalUnderlying / totalShares(a.k.a ERC20.totalSupply)
     */
    function minTransferAmount() external view returns (uint256);

    /**
     * @notice Checks bytes data length
     * @return Returns 'true' if data contains address in TON network in full or user-friendly format
     */
    function validateData(bytes calldata data) external pure returns (bool);

    /**
     * @notice Minting function that is accessible only to validators
     *         Converts underlying input amount to shares and checks it to be non-zero
     *         Can be paused
     * @param to Address for tokens to be minted for
     * @param amountUnderlying Input amount of TON tokens that are received in the TON network
     * @param salt Unique identifier from transaction in TON network
     * @param signature Array of signed encoded to+amountUnderlying+salt signatures from multiple validators
     */
    function mint(
        address to,
        uint256 amountUnderlying,
        bytes32 salt,
        bytes[] memory signature
    ) external;

    /**
     * @notice Minting function that is accessible only to validators
     *         Converts underlying input amount to shares and checks it to be non-zero
     *         Then these shares are wrapped to classic ERC20 pTON tokens
     *         Can be paused
     * @param to Address for tokens to be minted for
     * @param amountUnderlying Input amount of TON tokens that are received in the TON network
     * @param salt Unique identifier from transaction in TON network
     * @param signature Array of signed encoded to+amountUnderlying+salt signatures from multiple validators
     */
    function mintWrapped(
        address to,
        uint256 amountUnderlying,
        bytes32 salt,
        bytes[] memory signature
    ) external;

    /**
     * @notice Burning function to emit Burned() event which is monitored by validators
     *         Burns all available user balance
     *         Can be paused
     * @param data Metadata with a valid address in TON network to receive tokens
     */
    function burn(bytes memory data) external;

    /**
     * @notice Burning function to emit Burned() event which is monitored by validators
     *         Converts underlying input amount to shares and checks it to be non-zero
     *         Can be paused
     * @param amountUnderlying Input amount of TON tokens that to be bridged to the TON network
     * @param data Metadata with a valid address in TON network to receive tokens
     */
    function burn(uint256 amountUnderlying, bytes calldata data) external;

    /**
     * @notice Burning function to emit Burned() event which is monitored by validators
     *         Unwraps pTON tokens and burns acquired amount of stTON tokens
     *         Can be paused
     * @param amountWrapped Input amount of wrapped pTON tokens to be unwrapped
     * @param data Metadata with a valid address in TON network to receive tokens
     */
    function burnWrapped(uint256 amountWrapped, bytes memory data) external;

    /**
     * @notice Burning function to emit Burned() event which is monitored by validators
     *         Approves pTON tokens to itself via Permit
     *         Unwraps pTON tokens and burns acquired amount of stTON tokens
     *         Can be paused
     * @param amountWrapped Input amount of wrapped pTON tokens to be unwrapped
     * @param dataPermit Data for permit + metadata with a valid address in TON network to receive tokens
     *                   encoded in (uin256 deadline, uint8 v, bytes32 r, bytes32 s, bytes data)
     */
    function burnWrappedPermit(uint256 amountWrapped, bytes calldata dataPermit) external;

    /**
     * @notice Method for oracles to notify of updates in rewards in the TON network
     *         Incoming rewards can be negative if staking node was slashed
     *         Reward period is restricted from below to prevent instant rewards that can be sandwiched
     *         Can be paused
     * @param rewardsDelta Signed integer rewards amount that must be safely casted to int128 after 1e12 multiplication
     * @param rewardPeriod Period in seconds to linearly distribute rewards
     */
    function updateRewards(int256 rewardsDelta, uint64 rewardPeriod) external;
}
