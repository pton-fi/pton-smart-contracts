import { ethers, tracer, upgrades } from "hardhat";
import { expect } from "chai";
import { prepareEnvResult, prepareEnvResultP } from "./types";
const { getSigners } = ethers;
const { parseEther } = ethers.utils;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

// Constants
const name = "Pooled TON";
const symbol = "piTON";

describe("Testing piTON deployment", function () {
    async function prepareEnv(): Promise<prepareEnvResultP> {
        const [owner, alice, bob, oracle, validator, pauser] = await getSigners();

        const ImplV1 = await ethers.getContractFactory("stTON_mock_v1");
        const implSTON = await ImplV1.deploy();
        const Proxy = await ethers.getContractFactory("ERC1967Proxy");
        const proxy = await Proxy.deploy(implSTON.address, "0x");
        const PiTon = await ethers.getContractFactory("PooledTON");
        const piton = await PiTon.deploy(name, symbol, proxy.address);
        const stton = await ImplV1.attach(proxy.address);
        await stton.initialize(
            "Staked TON",
            "stTON",
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
        tracer.nameTags[stton.address] = "stton";
        tracer.nameTags[piton.address] = "piton";

        return {
            stton,
            piton,

            owner,
            alice,
            bob,
            oracle,
            validator,
            pauser,
        };
    }

    it("Deploy test", async () => {
        const { stton, piton, owner, alice, bob, oracle, validator, pauser } = await loadFixture(
            prepareEnv
        );

        const decimals = await stton.decimals();
        expect(await piton.name()).to.equal(name);
        expect(await piton.symbol()).to.equal(symbol);
        expect(await piton.decimals()).to.equal(decimals);
        expect(await piton.asset()).to.equal(stton.address);
    });

    it("Wrapping test", async () => {
        const { stton, piton, owner, alice, bob, oracle, validator, pauser } = await loadFixture(
            prepareEnv
        );

        const amountA = parseEther("0.001");
        const amountR = amountA.div(10);
        const one_day = 86400;
        const decimals = await piton.decimals();

        await stton.connect(validator).mint(alice.address, amountA);
        await stton.connect(validator).mint(bob.address, amountA);
        await stton.connect(alice).approve(piton.address, amountA);
        await piton.connect(alice).deposit(amountA, alice.address);
        expect(await piton.balanceOf(alice.address)).to.equal(amountA);
        expect(await piton.totalSupply()).to.equal(amountA);
        expect(await piton.convertToAssets(10**decimals)).to.equal(amountA.div(10 ** 6));
        await stton.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day);

        expect(await piton.balanceOf(alice.address)).to.equal(amountA);
        expect(await piton.totalSupply()).to.equal(amountA);
        expect(await piton.convertToAssets(10**decimals)).to.equal(
            amountA
                .add(amountR.div(2))
                .sub(1)
                .div(10 ** 6)
        );
        await stton.connect(bob).approve(piton.address, await stton.balanceOf(bob.address));
        await piton.connect(bob).deposit(await stton.balanceOf(bob.address), bob.address);
        expect(await piton.balanceOf(alice.address)).to.equal(amountA);
        expect(await piton.balanceOf(bob.address)).to.equal(amountA);
        expect(await piton.totalSupply()).to.equal(amountA.mul(2));

        await stton.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day);
        await piton.connect(alice).redeem(amountA, alice.address, alice.address);
        expect((await stton.balanceOf(alice.address)).div(10).mul(10)).to.equal(
            (await stton.balanceOf(piton.address)).div(10).mul(10)
        );
    });
});
