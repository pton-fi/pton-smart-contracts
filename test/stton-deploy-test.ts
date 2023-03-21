import { ethers, tracer, upgrades } from "hardhat";
import { expect } from "chai";
import { prepareEnvResult } from "./types";
const { getSigners } = ethers;
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// Constants
const name = "Staked TON";
const symbol = "stTON";

describe("Testing stTON UUPS proxy deployment", function () {
    async function prepareEnv(): Promise<prepareEnvResult> {
        const [owner, alice, bob, oracle, validator, pauser] = await getSigners();

        const ImplV1 = await ethers.getContractFactory("stTON_mock_v1");
        const implSTON = await ImplV1.deploy();
        const Proxy = await ethers.getContractFactory("ERC1967Proxy");
        const proxy = await Proxy.deploy(implSTON.address, "0x");
        const PiTon = await ethers.getContractFactory("PooledTON");
        const piton = await PiTon.deploy(name, symbol, proxy.address);
        const instance = await ImplV1.attach(proxy.address);
        await instance.initialize(
            name,
            symbol,
            oracle.address,
            validator.address,
            pauser.address,
            piton.address
        );

        tracer.nameTags[owner.address] = "owner";
        tracer.nameTags[alice.address] = "alice";
        tracer.nameTags[bob.address] = "bob";
        tracer.nameTags[oracle.address] = "oracle";
        tracer.nameTags[validator.address] = "validator";
        tracer.nameTags[pauser.address] = "pauser";
        tracer.nameTags[instance.address] = "instance";

        return {
            instance,

            owner,
            alice,
            bob,
            oracle,
            validator,
            pauser,
        };
    }

    it("Deploy test", async () => {
        const { instance, owner, alice, bob, oracle, validator, pauser } = await loadFixture(
            prepareEnv
        );

        expect(await instance.version()).to.equal(1);
        expect(await instance.name()).to.equal(name);
        expect(await instance.symbol()).to.equal(symbol);
        expect(await instance.decimals()).to.equal(9);
        const ownerRole = await instance.DEFAULT_ADMIN_ROLE();
        const oracleRole = await instance.ORACLE_ROLE();
        const validatorRole = await instance.VALIDATOR_ROLE();
        const pauserRole = await instance.PAUSER_ROLE();
        expect(await instance.hasRole(ownerRole, owner.address)).to.equal(true);
        expect(await instance.hasRole(oracleRole, oracle.address)).to.equal(true);
        expect(await instance.hasRole(validatorRole, validator.address)).to.equal(true);
        expect(await instance.hasRole(pauserRole, pauser.address)).to.equal(true);
        await expect(
            instance
                .connect(bob)
                .initialize(name, symbol, alice.address, alice.address, alice.address, alice.address)
        ).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("Upgrade test", async () => {
        const { instance, owner, alice, bob, oracle, validator, pauser } = await loadFixture(
            prepareEnv
        );

        expect(await instance.version()).to.equal(1);

        const piton = await instance.pTON();
        const ImplV2 = await ethers.getContractFactory("stTON_mock_v2");
        const implV2 = await ImplV2.deploy();
        await instance.upgradeTo(implV2.address);

        expect(await instance.version()).to.equal(2);
        expect(await instance.name()).to.equal(name);
        expect(await instance.symbol()).to.equal(symbol);
        const ownerRole = await instance.DEFAULT_ADMIN_ROLE();
        const oracleRole = await instance.ORACLE_ROLE();
        const validatorRole = await instance.VALIDATOR_ROLE();
        const pauserRole = await instance.PAUSER_ROLE();
        expect(await instance.hasRole(ownerRole, owner.address)).to.equal(true);
        expect(await instance.hasRole(oracleRole, oracle.address)).to.equal(true);
        expect(await instance.hasRole(validatorRole, validator.address)).to.equal(true);
        expect(await instance.hasRole(pauserRole, pauser.address)).to.equal(true);
        await expect(
            instance
                .connect(bob)
                .initialize(name, symbol, alice.address, alice.address, alice.address, alice.address)
        ).to.be.revertedWith("Initializable: contract is already initialized");
    });
});
