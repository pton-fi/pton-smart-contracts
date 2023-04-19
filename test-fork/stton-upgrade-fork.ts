import { ethers } from "hardhat";
import { expect } from "chai";
const { getContractAt, getSigner, getSigners } = ethers;
const { parseEther, formatUnits } = ethers.utils;
const { loadFixture, impersonateAccount } = require("@nomicfoundation/hardhat-network-helpers");

const oracleAddress = "0x1B2cB8A3494f79Be22C2E60A936F96f6863C9818";
const validator1Address = "0x1b855415179009e56946fDbC958e077966cF8650";
const validator2Address = "0x8E5479BA8C9dF8FaD26f0C1B625824675f2eD284";
const validator3Address = "0x88903de04A8BBB623f25252849C543B8a0b7a5a5";
const pauserAddress = "0xDBB09C654Ac72D794BAFBfE0bDad568582dB8e5e";
const stTONAddress = "0x0fB2E7c2d2754476aAa84762e44d3EE328AA9Ea2";
const deployerAddress = "0xEA5B0e3bf3c24e09daB1Cb1aB5270878d5b1ef71";


describe("Testing stTON upgrade", function () {
    it("Checking storage layout", async () => {
        const [owner] = await getSigners();

        await impersonateAccount(deployerAddress);
        const deployer = await getSigner(deployerAddress);

        await owner.sendTransaction({
            to: deployer.address,
            value: ethers.utils.parseEther("10.0"),
          });

        const stTON = await getContractAt(
            "stTON",
            stTONAddress
        );

        const before_DEFAULT_ADMIN_ROLE = await stTON.DEFAULT_ADMIN_ROLE();
        const before_ORACLE_ROLE = await stTON.ORACLE_ROLE();
        const before_PAUSER_ROLE = await stTON.PAUSER_ROLE();
        // const before_LIQUIDATOR_ROLE = await stTON.LIQUIDATOR_ROLE();
        const before_VALIDATOR_GROUP1 = await stTON.VALIDATOR_GROUP1();
        const before_VALIDATOR_GROUP2 = await stTON.VALIDATOR_GROUP2();
        const before_VALIDATOR_GROUP3 = await stTON.VALIDATOR_GROUP3();

        const before_DEFAULT_ADMIN_ROLE_count = await stTON.getRoleMemberCount(before_DEFAULT_ADMIN_ROLE);
        const before_ORACLE_ROLE_count = await stTON.getRoleMemberCount(before_ORACLE_ROLE);
        const before_PAUSER_ROLE_count = await stTON.getRoleMemberCount(before_PAUSER_ROLE);
        // const before_LIQUIDATOR_ROLE_count = await stTON.getRoleMemberCount(before_LIQUIDATOR_ROLE);
        const before_VALIDATOR_GROUP1_count = await stTON.getRoleMemberCount(before_VALIDATOR_GROUP1);
        const before_VALIDATOR_GROUP2_count = await stTON.getRoleMemberCount(before_VALIDATOR_GROUP2);
        const before_VALIDATOR_GROUP3_count = await stTON.getRoleMemberCount(before_VALIDATOR_GROUP3);

        expect(await stTON.hasRole(before_DEFAULT_ADMIN_ROLE, deployerAddress)).to.equal(true);
        expect(await stTON.hasRole(before_ORACLE_ROLE, oracleAddress)).to.equal(true);
        expect(await stTON.hasRole(before_PAUSER_ROLE, pauserAddress)).to.equal(true);
        // expect(await stTON.hasRole(before_LIQUIDATOR_ROLE, deployerAddress)).to.equal(false);
        expect(await stTON.hasRole(before_VALIDATOR_GROUP1, validator1Address)).to.equal(true);
        expect(await stTON.hasRole(before_VALIDATOR_GROUP2, validator2Address)).to.equal(true);
        expect(await stTON.hasRole(before_VALIDATOR_GROUP3, validator3Address)).to.equal(true);

        const before_DOMAIN_SEPARATOR = await stTON.DOMAIN_SEPARATOR();
        const before_pTON = await stTON.pTON();
        const before_pTON_allowance = await stTON.allowance(deployerAddress, before_pTON);
        const before_pTON_nonces = await stTON.nonces(before_pTON);

        const before_name = await stTON.name();
        const before_symbol = await stTON.symbol();
        const before_decimals = await stTON.decimals();
        const before_minTransferAmount = await stTON.minTransferAmount();
        const before_paused = await stTON.paused();

        const before_rewardsInfo = await stTON.rewardsInfo();
        const before_totalUnderlying = await stTON.totalUnderlying();

        const stTONUpgradedContract = await ethers.getContractFactory("stTON");
        const stTONUpgraded = await stTONUpgradedContract.deploy();
        await expect(stTON.upgradeTo(stTONUpgraded.address)).to.be.reverted;
        await stTON.connect(deployer).upgradeTo(stTONUpgraded.address);

        await expect(
            stTON
                .connect(deployer)
                .initialize(
                    "stTON2",
                    "stTON2",
                    deployer.address,
                    deployer.address,
                    deployer.address,
                    deployer.address,
                    deployer.address,
                    deployer.address
                )
        ).to.be.revertedWith("Initializable: contract is already initialized");

        const after_DEFAULT_ADMIN_ROLE = await stTON.DEFAULT_ADMIN_ROLE();
        const after_ORACLE_ROLE = await stTON.ORACLE_ROLE();
        const after_PAUSER_ROLE = await stTON.PAUSER_ROLE();
        // const after_LIQUIDATOR_ROLE = await stTON.LIQUIDATOR_ROLE();
        const after_VALIDATOR_GROUP1 = await stTON.VALIDATOR_GROUP1();
        const after_VALIDATOR_GROUP2 = await stTON.VALIDATOR_GROUP2();
        const after_VALIDATOR_GROUP3 = await stTON.VALIDATOR_GROUP3();

        expect(after_DEFAULT_ADMIN_ROLE).to.equal(before_DEFAULT_ADMIN_ROLE);
        expect(after_ORACLE_ROLE).to.equal(before_ORACLE_ROLE);
        expect(after_PAUSER_ROLE).to.equal(before_PAUSER_ROLE);
        // expect(after_LIQUIDATOR_ROLE).to.equal(before_LIQUIDATOR_ROLE);
        expect(after_VALIDATOR_GROUP1).to.equal(before_VALIDATOR_GROUP1);
        expect(after_VALIDATOR_GROUP2).to.equal(before_VALIDATOR_GROUP2);
        expect(after_VALIDATOR_GROUP3).to.equal(before_VALIDATOR_GROUP3);

        const after_DEFAULT_ADMIN_ROLE_count = await stTON.getRoleMemberCount(before_DEFAULT_ADMIN_ROLE);
        const after_ORACLE_ROLE_count = await stTON.getRoleMemberCount(before_ORACLE_ROLE);
        const after_PAUSER_ROLE_count = await stTON.getRoleMemberCount(before_PAUSER_ROLE);
        // const after_LIQUIDATOR_ROLE_count = await stTON.getRoleMemberCount(before_LIQUIDATOR_ROLE);
        const after_VALIDATOR_GROUP1_count = await stTON.getRoleMemberCount(before_VALIDATOR_GROUP1);
        const after_VALIDATOR_GROUP2_count = await stTON.getRoleMemberCount(before_VALIDATOR_GROUP2);
        const after_VALIDATOR_GROUP3_count = await stTON.getRoleMemberCount(before_VALIDATOR_GROUP3);

        expect(after_DEFAULT_ADMIN_ROLE_count).to.equal(before_DEFAULT_ADMIN_ROLE_count);
        expect(after_ORACLE_ROLE_count).to.equal(before_ORACLE_ROLE_count);
        expect(after_PAUSER_ROLE_count).to.equal(before_PAUSER_ROLE_count);
        // expect(after_LIQUIDATOR_ROLE_count).to.equal(before_LIQUIDATOR_ROLE_count);
        expect(after_VALIDATOR_GROUP1_count).to.equal(before_VALIDATOR_GROUP1_count);
        expect(after_VALIDATOR_GROUP2_count).to.equal(before_VALIDATOR_GROUP2_count);
        expect(after_VALIDATOR_GROUP3_count).to.equal(before_VALIDATOR_GROUP3_count);

        expect(await stTON.hasRole(before_DEFAULT_ADMIN_ROLE, deployerAddress)).to.equal(true);
        expect(await stTON.hasRole(before_ORACLE_ROLE, oracleAddress)).to.equal(true);
        expect(await stTON.hasRole(before_PAUSER_ROLE, pauserAddress)).to.equal(true);
        // expect(await stTON.hasRole(before_LIQUIDATOR_ROLE, deployerAddress)).to.equal(false);
        expect(await stTON.hasRole(before_VALIDATOR_GROUP1, validator1Address)).to.equal(true);
        expect(await stTON.hasRole(before_VALIDATOR_GROUP2, validator2Address)).to.equal(true);
        expect(await stTON.hasRole(before_VALIDATOR_GROUP3, validator3Address)).to.equal(true);

        const after_DOMAIN_SEPARATOR = await stTON.DOMAIN_SEPARATOR();
        const after_pTON = await stTON.pTON();
        const after_pTON_allowance = await stTON.allowance(deployerAddress, after_pTON);
        const after_pTON_nonces = await stTON.nonces(after_pTON);

        expect(after_DOMAIN_SEPARATOR).to.equal(before_DOMAIN_SEPARATOR);
        expect(after_pTON).to.equal(before_pTON);
        expect(after_pTON_allowance).to.equal(before_pTON_allowance);
        expect(after_pTON_nonces).to.equal(before_pTON_nonces);

        const after_name = await stTON.name();
        const after_symbol = await stTON.symbol();
        const after_decimals = await stTON.decimals();
        const after_minTransferAmount = await stTON.minTransferAmount();
        const after_paused = await stTON.paused();

        expect(after_name).to.equal(before_name);
        expect(after_symbol).to.equal(before_symbol);
        expect(after_decimals).to.equal(before_decimals);
        expect(after_minTransferAmount).to.equal(before_minTransferAmount);
        expect(after_paused).to.equal(before_paused);

        const after_rewardsInfo = await stTON.rewardsInfo();
        const after_totalUnderlying = await stTON.totalUnderlying();

        expect(after_rewardsInfo.rewardRate).to.equal(before_rewardsInfo.rewardRate);
        expect(after_totalUnderlying).to.equal(before_totalUnderlying);

    });
});