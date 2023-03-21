import { ethers, tracer, upgrades } from "hardhat";
import { expect } from "chai";
import { prepareEnvResult } from "./types";
const { getSigners } = ethers;
const { parseEther } = ethers.utils;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const abi = ethers.utils.defaultAbiCoder;

// Constants
const name = "Staked TON";
const symbol = "stTON";

describe("Testing stTON pausable functions", function () {
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

    it("Pausing test", async () => {
        const { instance, owner, alice, bob, oracle, validator, pauser } = await loadFixture(
            prepareEnv
        );

        const amountA = parseEther("0.001");
        const amountR = amountA.div(10);
        const one_day = 86400;
        const pauserRole = await instance.PAUSER_ROLE();

        await instance.connect(validator).mint(alice.address, amountA);
        await instance.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day);
        await instance.connect(alice).transfer(bob.address, amountR);

        const lowerOwnerAddress = owner.address.toString().toLowerCase();
        await expect(instance.connect(owner).setPause(true)).to.be.revertedWith(
            `AccessControl: account ${lowerOwnerAddress} is missing role ${pauserRole}`
        );

        await instance.connect(pauser).setPause(true);
        await expect(instance.connect(validator).mint(alice.address, amountA)).to.be.revertedWith(
            "Pausable: paused"
        );
        await expect(instance.connect(oracle).updateRewards(amountR, one_day)).to.be.revertedWith(
            "Pausable: paused"
        );
        await expect(instance.connect(alice).transfer(bob.address, amountR)).to.be.revertedWith(
            "Pausable: paused"
        );
        await expect(instance.connect(pauser).setPause(true)).to.be.revertedWith(
            "Pausable: paused"
        );

        await instance.connect(pauser).setPause(false);
        await instance.connect(validator).mint(alice.address, amountA);
        await instance.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day);
        await instance.connect(alice).transfer(bob.address, amountR);
    });
});
