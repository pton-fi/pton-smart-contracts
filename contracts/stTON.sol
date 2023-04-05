// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SignedMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";
import "@openzeppelin/contracts/interfaces/IERC4626.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";
import "./erc20/ERC20PermitUpgradeable.sol";
import "./interfaces/IstTON.sol";

contract stTON is
    ERC20PermitUpgradeable,
    UUPSUpgradeable,
    AccessControlEnumerableUpgradeable,
    PausableUpgradeable,
    Multicall,
    IstTON
{
    using SignedMathUpgradeable for int256;
    using SafeCastUpgradeable for *;

    uint64 internal constant MIN_REWARD_PERIOD = 12 hours;
    uint256 internal constant MAX_REWARD_DELTA = 1e15;
    int256 internal constant FACTOR = 1e12;
    uint256 internal constant SUPPORTED_DATA_LENGTH_FULL = 36;
    uint256 internal constant SUPPORTED_DATA_LENGTH_EASY = 48;
    bytes32 internal constant VALIDATE_TYPEHASH =
        keccak256("Validate(address to,uint256 amount,bytes32 salt)");

    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    bytes32 public constant VALIDATOR_GROUP1 = keccak256("VALIDATOR_GROUP1");
    bytes32 public constant VALIDATOR_GROUP2 = keccak256("VALIDATOR_GROUP2");
    bytes32 public constant VALIDATOR_GROUP3 = keccak256("VALIDATOR_GROUP3");

    RewardsInfo public rewardsInfo;
    uint256 public totalUnderlying;
    address public pTON;
    mapping(bytes32 => bool) public usedHashes;

    function initialize(
        string memory name_,
        string memory symbol_,
        address oracle_,
        address validator1_,
        address validator2_,
        address validator3_,
        address pauser_,
        address wrapper_
    ) external initializer {
        if (
            validator1_ == address(0) ||
            validator2_ == address(0) ||
            validator3_ == address(0) ||
            wrapper_ == address(0)
        ) revert ZeroAddress();
        __ERC20_init(name_, symbol_);
        __ERC20Permit_init(name_);
        __AccessControlEnumerable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(ORACLE_ROLE, oracle_);
        _setupRole(VALIDATOR_GROUP1, validator1_);
        _setupRole(VALIDATOR_GROUP2, validator2_);
        _setupRole(VALIDATOR_GROUP3, validator3_);
        _setupRole(PAUSER_ROLE, pauser_);

        pTON = wrapper_;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return
            (ERC20Upgradeable.balanceOf(account) * _totalUnderlying()) /
            ERC20Upgradeable.totalSupply();
    }

    function decimals() public pure override returns (uint8) {
        return 9;
    }

    function minTransferAmount() external view returns (uint256) {
        return _sharesToUnderlying(2);
    }

    function totalSupply() public view override returns (uint256) {
        return _totalUnderlying();
    }

    function validateData(bytes memory data) public pure returns (bool) {
        return
            data.length == SUPPORTED_DATA_LENGTH_FULL || data.length == SUPPORTED_DATA_LENGTH_EASY;
    }

    function burn(bytes memory data) external whenNotPaused {
        _validateData(data);
        _burn(_msgSender(), balanceOf(_msgSender()), data);
    }

    function burn(uint256 amountUnderlying, bytes memory data) external whenNotPaused {
        _validateData(data);
        _burn(_msgSender(), amountUnderlying, data);
    }

    function burnWrapped(uint256 amountWrapped, bytes memory data) external whenNotPaused {
        _validateData(data);
        uint256 amountUnderlying = IERC4626(pTON).redeem(
            amountWrapped,
            address(this),
            _msgSender()
        );
        _burn(address(this), amountUnderlying, data);
    }

    function burnWrappedPermit(
        uint256 amountWrapped,
        bytes calldata dataPermit
    ) external whenNotPaused {
        (uint256 deadline, uint8 v, bytes32 r, bytes32 s, bytes memory data) = abi.decode(
            dataPermit,
            (uint256, uint8, bytes32, bytes32, bytes)
        );
        address wrapper = pTON;
        _validateData(data);
        ERC20PermitUpgradeable(wrapper).permit(
            _msgSender(),
            address(this),
            amountWrapped,
            deadline,
            v,
            r,
            s
        );
        uint256 amountUnderlying = IERC4626(wrapper).redeem(
            amountWrapped,
            address(this),
            _msgSender()
        );
        _burn(address(this), amountUnderlying, data);
    }

    function mint(
        address to,
        uint256 amountUnderlying,
        bytes32 salt,
        bytes[] memory signature
    ) external whenNotPaused {
        _validateInput(to, salt);
        uint256 shares = _validateShares(amountUnderlying);
        _validateSignature(to, amountUnderlying, salt, signature);

        _mint(to, amountUnderlying, shares, salt);
        _updateUnderlying(amountUnderlying.toInt256());
    }

    function mintWrapped(
        address to,
        uint256 amountUnderlying,
        bytes32 salt,
        bytes[] memory signature
    ) external whenNotPaused {
        _validateInput(to, salt);
        uint256 shares = _validateShares(amountUnderlying);
        _validateSignature(to, amountUnderlying, salt, signature);

        _mint(address(this), amountUnderlying, shares, salt);
        _updateUnderlying(amountUnderlying.toInt256());

        address wrapper = pTON;
        _approve(address(this), wrapper, amountUnderlying);
        IERC4626(wrapper).deposit(amountUnderlying, to);
    }

    function updateRewards(
        int256 rewardsDelta,
        uint64 rewardPeriod
    ) external whenNotPaused onlyRole(ORACLE_ROLE) {
        if (rewardPeriod < MIN_REWARD_PERIOD) revert BelowMinRewardPeriod();
        if (rewardsDelta.abs() > MAX_REWARD_DELTA) revert AboveMaxRewardDelta();
        RewardsInfo memory updatedRewardsInfo = _updateRewards(rewardsDelta, rewardPeriod);
        emit Rewarded(updatedRewardsInfo);
    }

    function flashLoan(
        IERC3156FlashBorrowerUpgradeable receiver,
        address token,
        uint256 amountUnderlying,
        bytes calldata data
    ) public virtual override onlyRole(LIQUIDATOR_ROLE)  returns (bool) {
        uint256 shares = _validateShares(amountUnderlying);
        return super.flashLoan(receiver, token, shares, data);
    }

    function _burn(address from, uint256 amountUnderlying, bytes memory data) internal {
        uint256 shares = _validateShares(amountUnderlying);
        _burn(from, shares);
        _updateUnderlying(-amountUnderlying.toInt256());
        emit Burned(from, amountUnderlying, data);
        emit Transfer(from, address(0), amountUnderlying);
    }

    function _mint(address to, uint256 amountUnderlying, uint256 shares, bytes32 salt) internal {
        _mint(to, shares);
        emit Minted(to, salt);
        emit Transfer(address(0), to, amountUnderlying);
    }

    function _pendingRewards() internal view returns (int256) {
        RewardsInfo memory currentRewardsInfo = rewardsInfo;
        int256 timestamp = int256(block.timestamp);
        int256 start = int256(uint256(currentRewardsInfo.startOfRewardPeriod));
        int256 end = int256(uint256(currentRewardsInfo.endOfRewardPeriod));
        int256 rate = int256(currentRewardsInfo.rewardRate);

        if (timestamp < start) {
            return 0;
        }

        if (timestamp > end) {
            return ((end - start) * rate) / FACTOR;
        }

        return ((timestamp - start) * rate) / FACTOR;
    }

    function _sharesToUnderlying(uint256 shares) internal view returns (uint256) {
        return (shares * _totalUnderlying()) / ERC20Upgradeable.totalSupply();
    }

    function _totalUnderlying() internal view returns (uint256) {
        return (totalUnderlying.toInt256() + _pendingRewards()).toUint256();
    }

    function _underlyingToShares(uint256 amountUnderlying) internal view returns (uint256) {
        uint256 currentSupply = ERC20Upgradeable.totalSupply();
        return
            currentSupply == 0
                ? amountUnderlying
                : (amountUnderlying * currentSupply) / _totalUnderlying();
    }

    function _transfer(
        address from,
        address to,
        uint256 amountUnderlying
    ) internal override whenNotPaused {
        uint256 shares = _validateShares(amountUnderlying);
        super._transfer(from, to, shares);
        emit Transfer(from, to, amountUnderlying);
    }

    function _updateUnderlying(int256 supplyDelta) internal {
        if (supplyDelta == 0) return;

        int256 newSupply = totalUnderlying.toInt256() + supplyDelta;
        totalUnderlying = newSupply.toUint256();
    }

    function _updateRewards(
        int256 rewardsDelta,
        uint64 rewardPeriod
    ) internal returns (RewardsInfo memory currentRewardsInfo) {
        _updateUnderlying(_pendingRewards());

        currentRewardsInfo = rewardsInfo;
        uint64 timestamp_u64 = uint64(block.timestamp);
        int256 timestamp = int256(block.timestamp);
        int256 period = int256(uint256(rewardPeriod));
        int256 start = int256(uint256(currentRewardsInfo.startOfRewardPeriod));
        int256 end = int256(uint256(currentRewardsInfo.endOfRewardPeriod));
        int256 rate = int256(currentRewardsInfo.rewardRate);
        int256 rewardRemainder;

        if (timestamp < start) {
            rewardRemainder = end - start;
        } else if (timestamp < end) {
            rewardRemainder = end - timestamp;
        }

        currentRewardsInfo = RewardsInfo({
            rewardRate: ((rewardsDelta * FACTOR + rewardRemainder * rate) / period).toInt128(),
            startOfRewardPeriod: timestamp_u64,
            endOfRewardPeriod: timestamp_u64 + rewardPeriod
        });
        rewardsInfo = currentRewardsInfo;
        return currentRewardsInfo;
    }

    function _validateData(bytes memory data) internal pure {
        if (!validateData(data)) revert InvalidData();
    }

    function _validateInput(
        address to,
        bytes32 salt
    ) internal pure {
        if (to == address(0)) revert ZeroAddress();
        if (salt == bytes32(0)) revert InvalidSalt();
    }

    function _validateShares(
        uint256 amountUnderlying
    ) internal view returns (uint256) {
        uint256 shares = _underlyingToShares(amountUnderlying);
        if (shares == 0) revert ZeroShares();
        return shares;
    }

    function _validateSignature(
        address to,
        uint256 amount,
        bytes32 salt,
        bytes[] memory signature
    ) internal {
        bytes32 hash = keccak256(abi.encode(VALIDATE_TYPEHASH, to, amount, salt));
        if (usedHashes[hash]) revert AlreadyUsedSignature();
        usedHashes[hash] = true;

        uint256 len = signature.length;
        uint256 valGroup1Count;
        uint256 valGroup2Count;
        uint256 valGroup3Count;
        bytes32 digest = _hashTypedDataV4(hash);
        address signer;
        for (uint256 i; i < len; ) {
            signer = ECDSAUpgradeable.recover(digest, signature[i]);
            if (hasRole(VALIDATOR_GROUP1, signer)) {
                valGroup1Count++;
            } else if (hasRole(VALIDATOR_GROUP2, signer)) {
                valGroup2Count++;
            } else if (hasRole(VALIDATOR_GROUP3, signer)) {
                valGroup3Count++;
            }
            unchecked {
                i++;
            }
        }
        _validateGroupCount(valGroup1Count, valGroup2Count, valGroup3Count);
    }

    function _validateGroupCount(
        uint256 valGroup1Count,
        uint256 valGroup2Count,
        uint256 valGroup3Count
    ) internal pure {
        uint256 positiveGroup;
        if (valGroup1Count > 0) positiveGroup++;
        if (valGroup2Count > 0) positiveGroup++;
        if (valGroup3Count > 0) positiveGroup++;

        if (positiveGroup < 2) revert ValidationFailed();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function setPause(bool newState) external onlyRole(PAUSER_ROLE) {
        newState ? _pause() : _unpause();
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
}
