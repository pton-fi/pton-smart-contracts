import { expect } from "chai";
import { prepareEnv } from "./prepare";
const { parseEther } = ethers.utils;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

const name = "pTON";
const symbol = "pTON";
const decimals = 9;

describe("Testing pTON deployment", function () {
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

        const decimals = await stton.decimals();
        expect(await pton.name()).to.equal(name);
        expect(await pton.symbol()).to.equal(symbol);
        expect(await pton.decimals()).to.equal(decimals);
        expect(await pton.asset()).to.equal(stton.address);
    });

    it("Wrapping test", async () => {
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

        const amountA = parseEther("0.001");
        const amountR = amountA.div(10);
        const one_day = 86400;
        const decimals = await pton.decimals();

        const chainId = 31337;
        const name = await stton.name();
        const version = "1";
        const verifyingContract = stton.address;
        const salt1 = "0x0000000000000000000000000000000000000000000000000000000000000001";
        const salt2 = "0x0000000000000000000000000000000000000000000000000000000000000002";

        const sigA1 = await validator1._signTypedData(
            { name, version, chainId, verifyingContract },
            {
                Validate: [
                    { name: "to", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "salt", type: "bytes32" },
                ],
            },
            {
                to: alice.address,
                amount: amountA,
                salt: salt1,
            }
        );
        const sigA2 = await validator2._signTypedData(
            { name, version, chainId, verifyingContract },
            {
                Validate: [
                    { name: "to", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "salt", type: "bytes32" },
                ],
            },
            {
                to: alice.address,
                amount: amountA,
                salt: salt1,
            }
        );
        const sigA3 = await validator3._signTypedData(
            { name, version, chainId, verifyingContract },
            {
                Validate: [
                    { name: "to", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "salt", type: "bytes32" },
                ],
            },
            {
                to: alice.address,
                amount: amountA,
                salt: salt1,
            }
        );
        const sigA = [sigA1, sigA2, sigA3];
        await stton.connect(bob).mint(alice.address, amountA, salt1, sigA);

        const sigB1 = await validator1._signTypedData(
            { name, version, chainId, verifyingContract },
            {
                Validate: [
                    { name: "to", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "salt", type: "bytes32" },
                ],
            },
            {
                to: bob.address,
                amount: amountA,
                salt: salt2,
            }
        );
        const sigB2 = await validator2._signTypedData(
            { name, version, chainId, verifyingContract },
            {
                Validate: [
                    { name: "to", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "salt", type: "bytes32" },
                ],
            },
            {
                to: bob.address,
                amount: amountA,
                salt: salt2,
            }
        );
        const sigB3 = await validator3._signTypedData(
            { name, version, chainId, verifyingContract },
            {
                Validate: [
                    { name: "to", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "salt", type: "bytes32" },
                ],
            },
            {
                to: bob.address,
                amount: amountA,
                salt: salt2,
            }
        );
        const sigB = [sigB1, sigB2, sigB3];
        await stton.connect(alice).mint(bob.address, amountA, salt2, sigB);
        await stton.connect(alice).approve(pton.address, amountA);
        await pton.connect(alice).deposit(amountA, alice.address);
        expect(await pton.balanceOf(alice.address)).to.equal(amountA);
        expect(await pton.totalSupply()).to.equal(amountA);
        expect(await pton.convertToAssets(10 ** decimals)).to.equal(amountA.div(10 ** 6));
        await stton.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day);

        expect(await pton.balanceOf(alice.address)).to.equal(amountA);
        expect(await pton.totalSupply()).to.equal(amountA);
        expect(await pton.convertToAssets(10 ** decimals)).to.equal(
            amountA
                .add(amountR.div(2))
                .sub(1)
                .div(10 ** 6)
        );
        await stton.connect(bob).approve(pton.address, await stton.balanceOf(bob.address));
        await pton.connect(bob).deposit(await stton.balanceOf(bob.address), bob.address);
        expect(await pton.balanceOf(alice.address)).to.equal(amountA);
        expect(await pton.balanceOf(bob.address)).to.equal(amountA);
        expect(await pton.totalSupply()).to.equal(amountA.mul(2));

        await stton.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day);
        await pton.connect(alice).redeem(amountA, alice.address, alice.address);
        expect((await stton.balanceOf(alice.address)).div(10).mul(10)).to.equal(
            (await stton.balanceOf(pton.address)).div(10).mul(10)
        );
    });
});
