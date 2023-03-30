import { expect } from "chai";
import { prepareEnv } from "./prepare";
const { parseEther } = ethers.utils;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

// Constants
const name = "stTON";
const symbol = "stTON";
const decimals = 9;

describe("Testing stTON UUPS proxy deployment", function () {
    it("Deploy test", async () => {
        const {
            stton,
            pton,
            owner,
            alice,
            bob,
            oracle,
            validator1,
            validator2,
            validator3,
            pauser,
        } = await loadFixture(prepareEnv);

        expect(await stton.name()).to.equal(name);
        expect(await stton.symbol()).to.equal(symbol);
        expect(await stton.decimals()).to.equal(decimals);
        const ownerRole = await stton.DEFAULT_ADMIN_ROLE();
        const oracleRole = await stton.ORACLE_ROLE();
        const validatorRole = await stton.VALIDATOR_GROUP1();
        const pauserRole = await stton.PAUSER_ROLE();
        expect(await stton.hasRole(ownerRole, owner.address)).to.equal(true);
        expect(await stton.hasRole(oracleRole, oracle.address)).to.equal(true);
        expect(await stton.hasRole(validatorRole, validator1.address)).to.equal(true);
        expect(await stton.hasRole(pauserRole, pauser.address)).to.equal(true);
        await expect(
            stton
                .connect(bob)
                .initialize(
                    name,
                    symbol,
                    alice.address,
                    alice.address,
                    alice.address,
                    alice.address,
                    alice.address,
                    alice.address
                )
        ).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("Upgrade test", async () => {
        const {
            stton,
            pton,
            owner,
            alice,
            bob,
            oracle,
            validator1,
            validator2,
            validator3,
            pauser,
        } = await loadFixture(prepareEnv);

        const ImplV2 = await ethers.getContractFactory("stTON_mock_v2");
        const implV2 = await ImplV2.deploy();
        await stton.upgradeTo(implV2.address);
        const stton2 = await ImplV2.attach(stton.address);

        expect(await stton2.version()).to.equal(2);
        expect(await stton2.name()).to.equal(name);
        expect(await stton2.symbol()).to.equal(symbol);
        const ownerRole = await stton2.DEFAULT_ADMIN_ROLE();
        const oracleRole = await stton2.ORACLE_ROLE();
        const validatorRole = await stton2.VALIDATOR_GROUP1();
        const pauserRole = await stton2.PAUSER_ROLE();
        expect(await stton2.hasRole(ownerRole, owner.address)).to.equal(true);
        expect(await stton2.hasRole(oracleRole, oracle.address)).to.equal(true);
        expect(await stton2.hasRole(validatorRole, validator1.address)).to.equal(true);
        expect(await stton2.hasRole(pauserRole, pauser.address)).to.equal(true);
        await expect(
            stton2
                .connect(bob)
                .initialize(
                    name,
                    symbol,
                    alice.address,
                    alice.address,
                    alice.address,
                    alice.address,
                    alice.address,
                    alice.address
                )
        ).to.be.revertedWith("Initializable: contract is already initialized");
    });
});
