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

describe("Testing stTON rewards distribution functions", function () {
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

    it("Rewarding test", async () => {
        const { instance, owner, alice, bob, oracle, validator, pauser } = await loadFixture(
            prepareEnv
        );

        const amountA = parseEther("0.001");
        const amountR = amountA.mul(2).div(100);
        const one_day = 86400;
        await instance.connect(validator).mint(alice.address, amountA);
        await instance.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day);

        const amountB = parseEther("0.000001");
        await instance.connect(validator).mint(bob.address, amountB);

        await instance.connect(oracle).updateRewards(amountR, one_day);
        let balB = await instance.balanceOf(bob.address);
        let balA = await instance.balanceOf(alice.address);
        expect(balB).to.equal(amountB.sub(1));
        expect(balA).to.equal(amountA.add(amountR).sub(1));
        await time.increase(one_day);

        const shareOfBob = amountB.mul(amountA).div(amountA.add(amountR).sub(1));
        balA = await instance.balanceOf(alice.address);
        balB = await instance.balanceOf(bob.address);
        const totalSupply = await instance.totalSupply();
        expect(balB).to.equal(
            amountB.add(shareOfBob.mul(amountR).div(shareOfBob.add(amountA))).sub(1)
        );
        expect(balA).to.equal(
            amountA
                .add(amountR)
                .add(amountA.mul(amountR).div(shareOfBob.add(amountA)))
                .sub(1)
        );
        expect(balA.add(balB)).to.equal(totalSupply.sub(1));
    });

    it("Overlapping rewards test", async () => {
        const { instance, owner, alice, bob, oracle, validator, pauser } = await loadFixture(
            prepareEnv
        );

        const amountA = parseEther("0.001");
        const rounding = parseEther("0.000001");
        const amountR = amountA.div(10);
        const one_day = 86400;
        await instance.connect(validator).mint(alice.address, amountA);
        await instance.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day / 2);

        await instance.connect(validator).mint(bob.address, amountA);
        await instance.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day);

        const shareOfBob = amountA.mul(amountA).div(amountA.add(amountR.div(2)).sub(1));
        const balA = await instance.balanceOf(alice.address);
        const balB = await instance.balanceOf(bob.address);
        const totalSupply = await instance.totalSupply();

        expect(balB.div(rounding).mul(rounding)).to.equal(
            amountA
                .add(shareOfBob.mul(amountR.add(amountR.div(2))).div(shareOfBob.add(amountA)))
                .div(rounding)
                .mul(rounding)
        );
        expect(balA.div(rounding).mul(rounding)).to.equal(
            amountA
                .add(amountR.div(2))
                .add(amountA.mul(amountR.add(amountR.div(2))).div(shareOfBob.add(amountA)))
                .div(rounding)
                .mul(rounding)
        );
        expect(balA.add(balB).div(2).mul(2)).to.equal(totalSupply.div(2).mul(2));
    });

    it("Reinvesting test", async () => {
        const { instance, owner, alice, bob, oracle, validator, pauser } = await loadFixture(
            prepareEnv
        );

        const amountA = parseEther("0.001");
        const amountR = amountA.div(10);
        const one_day = 86400;
        await instance.connect(validator).mint(alice.address, amountA);
        await instance.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day);

        await instance.connect(validator).mint(bob.address, amountA);
        await instance.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day);

        await instance.connect(validator).mint(owner.address, amountA);
        const burn = "burn(uint256,bytes)";
        const addressTONeasy = ethers.utils.toUtf8Bytes(
            "kf_8uRo6OBbQ97jCx2EIuKm8Wmt6Vb15-KsQHFLbKSMiYIny"
        );
        let balB = await instance.balanceOf(bob.address);
        let balO = await instance.balanceOf(owner.address);
        let balA = await instance.balanceOf(alice.address);
        await instance.connect(alice)[burn](balA, addressTONeasy);
        await instance.connect(validator).mint(alice.address, balA);
        expect(await instance.balanceOf(bob.address)).to.equal(balB);
        expect((await instance.balanceOf(alice.address)).div(10).mul(10)).to.equal(
            balA.div(10).mul(10)
        );
        expect(await instance.balanceOf(owner.address)).to.equal(balO);
    });
});
