import { ethers, tracer, upgrades } from "hardhat";
import { expect } from "chai";
import { MintInfoInterface, prepareEnvResult } from "./types";
import { mintCalldata } from "./helper";
import { BigNumber } from "ethers";
const { getSigners } = ethers;
const { parseEther } = ethers.utils;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const abi = ethers.utils.defaultAbiCoder;

// Constants
const name = "Staked TON";
const symbol = "stTON";

describe("Testing stTON ERC20 functions", function () {
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

    it("Minting test", async () => {
        const { instance, owner, alice, bob, oracle, validator, pauser } = await loadFixture(
            prepareEnv
        );

        const amountUnderlyingToMint = 1000;
        const amountRewardsToDistribute = 1000000;
        await instance.connect(validator).mint(alice.address, amountUnderlyingToMint);
        expect(await instance.balanceOf(alice.address)).to.equal(amountUnderlyingToMint);
        expect(await instance.totalSupply()).to.equal(amountUnderlyingToMint);

        const one_day = 86400;
        await instance.connect(oracle).updateRewards(amountRewardsToDistribute, one_day);
        await time.increase(one_day);
        const balAlice = await instance.balanceOf(alice.address);
        const totalSupply = await instance.totalSupply();
        const totalUnderlying = await instance.totalUnderlying();
        const amount2Shares = await instance.minTransferAmount();
        expect(balAlice).to.equal(amountRewardsToDistribute + amountUnderlyingToMint - 1);
        expect(balAlice).to.equal(totalSupply);
        expect(totalUnderlying).to.equal(amountUnderlyingToMint);
        expect(amount2Shares).to.equal(
            Math.floor(
                (2 * (amountRewardsToDistribute + amountUnderlyingToMint - 1)) /
                    amountUnderlyingToMint
            )
        );
    });

    it("Multicall mint", async () => {
        const { instance, validator } = await loadFixture(prepareEnv);

        const amountUnderlyingToMint = BigNumber.from(1_000_000_000);
        const signers = await getSigners();
        const mintInfo: MintInfoInterface[] = signers.map((user) => ({
            amountUnderlying: amountUnderlyingToMint,
            to: user.address,
        }));
        const calldata = mintCalldata(instance, mintInfo);
        await instance.connect(validator).multicall(calldata);
        const prmsArr = signers.map((acc) =>
            instance
                .balanceOf(acc.address)
                .then((balance) => expect(balance).to.equal(amountUnderlyingToMint))
        );
        await Promise.all(prmsArr);
    });

    it("Burning test", async () => {
        const { instance, owner, alice, bob, oracle, validator, pauser } = await loadFixture(
            prepareEnv
        );
        const burn = "burn(uint256,bytes)";
        const burnFrom = "burn(address,uint256,bytes)";

        const amountUnderlyingToMint = 1000000;
        const amountRewardsToDistribute = 100000;
        await instance.connect(validator).mint(alice.address, amountUnderlyingToMint);
        expect(await instance.balanceOf(alice.address)).to.equal(amountUnderlyingToMint);
        expect(await instance.totalSupply()).to.equal(amountUnderlyingToMint);

        const one_day = 86400;
        const addressTONfull =
            "0x012345678901234567890123456789012345678901234567890123456789012345678901";
        const addressTONeasy = ethers.utils.toUtf8Bytes(
            "kf_8uRo6OBbQ97jCx2EIuKm8Wmt6Vb15-KsQHFLbKSMiYIny"
        );
        const addressTONwrong = ethers.utils.toUtf8Bytes(
            "kf_8uRo6OBbQ97jCx2EIuKm8Wmt6Vb15-KsQHFLbKSMiYIny_2"
        );

        await instance.connect(oracle).updateRewards(amountRewardsToDistribute, one_day);
        await time.increase(one_day);
        await instance.connect(validator).mint(bob.address, amountUnderlyingToMint);
        await expect(
            instance.connect(alice)[burn](1, addressTONwrong)
        ).to.be.revertedWithCustomError(instance, "InvalidData");
        await expect(
            instance.connect(alice)[burn](1, addressTONeasy)
        ).to.be.revertedWithCustomError(instance, "ZeroShares");
        const amount1Share = await instance.minTransferAmount();
        await expect(instance.connect(alice)[burn](amount1Share, addressTONeasy))
            .to.emit(instance, "Burned")
            .withArgs(alice.address, amount1Share, addressTONeasy);
        const balanceAlice = await instance.balanceOf(alice.address);
        await instance.connect(alice).approve(bob.address, balanceAlice);
        await expect(instance.connect(bob)[burnFrom](alice.address, balanceAlice, addressTONfull))
            .to.emit(instance, "Burned")
            .withArgs(alice.address, balanceAlice, addressTONfull);
    });

    it("Transfer test", async () => {
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
        const amount2Shares = await instance.minTransferAmount();
        await expect(
            instance.connect(bob).transfer(alice.address, amount2Shares.div(2))
        ).to.be.revertedWithCustomError(instance, "ZeroShares");

        const balA = await instance.balanceOf(alice.address);
        const balB = await instance.balanceOf(bob.address);
        await instance.connect(bob).transfer(alice.address, balB);
        expect((await instance.balanceOf(alice.address)).div(10).mul(10)).to.equal(
            balA.add(balB).div(10).mul(10)
        );
        expect((await instance.balanceOf(bob.address)).div(2).mul(2)).to.equal(0);
    });
});
