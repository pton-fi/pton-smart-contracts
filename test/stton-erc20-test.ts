import { expect } from "chai";
import { MintInfoInterface, prepareEnv } from "./prepare";
import { mintCalldata } from "./helper";
import { BigNumber } from "ethers";
const { parseEther } = ethers.utils;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Testing stTON ERC20 functions", function () {
    it("Burning test", async () => {
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

        const burn = "burn(uint256,bytes)";
        const burnBal = "burn(bytes)";

        const amountUnderlyingToMint = 1000000;
        const amountRewardsToDistribute = 100;
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
                amount: amountUnderlyingToMint,
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
                amount: amountUnderlyingToMint,
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
                amount: amountUnderlyingToMint,
                salt: salt1,
            }
        );
        const sigA = [sigA1, sigA2, sigA3];
        await stton.connect(alice).mint(alice.address, amountUnderlyingToMint, salt1, sigA);

        expect(await stton.balanceOf(alice.address)).to.equal(amountUnderlyingToMint);
        expect(await stton.totalSupply()).to.equal(amountUnderlyingToMint);

        const one_day = 86400;
        const addressTONfull =
            "0x012345678901234567890123456789012345678901234567890123456789012345678901";
        const addressTONeasy = ethers.utils.toUtf8Bytes(
            "kf_8uRo6OBbQ97jCx2EIuKm8Wmt6Vb15-KsQHFLbKSMiYIny"
        );
        const addressTONwrong = ethers.utils.toUtf8Bytes(
            "kf_8uRo6OBbQ97jCx2EIuKm8Wmt6Vb15-KsQHFLbKSMiYIny_2"
        );

        await stton.connect(oracle).updateRewards(amountRewardsToDistribute, one_day);
        await time.increase(one_day);

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
                amount: amountUnderlyingToMint,
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
                amount: amountUnderlyingToMint,
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
                amount: amountUnderlyingToMint,
                salt: salt2,
            }
        );
        const sigB = [sigB1, sigB2, sigB3];
        await stton.connect(bob).mint(bob.address, amountUnderlyingToMint, salt2, sigB);

        await expect(stton.connect(alice)[burn](1, addressTONwrong)).to.be.revertedWithCustomError(
            stton,
            "InvalidData"
        );
        await expect(stton.connect(alice)[burn](1, addressTONeasy)).to.be.revertedWithCustomError(
            stton,
            "ZeroShares"
        );
        const amount1Share = await stton.minTransferAmount();
        await expect(stton.connect(alice)[burn](amount1Share, addressTONeasy))
            .to.emit(stton, "Burned")
            .withArgs(alice.address, amount1Share, addressTONeasy);
        const balanceAlice = await stton.balanceOf(alice.address);
        await stton.connect(alice).approve(bob.address, balanceAlice);
        await expect(stton.connect(alice)[burnBal](addressTONfull))
            .to.emit(stton, "Burned")
            .withArgs(alice.address, balanceAlice, addressTONfull);
    });

    it("Transfer test", async () => {
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
        const amountR = amountA.div(1000);
        const one_day = 86400;
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
        await stton.connect(alice).mint(alice.address, amountA, salt1, sigA);

        await stton.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day);

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
        await stton.connect(bob).mint(bob.address, amountA, salt2, sigB);

        const amount2Shares = await stton.minTransferAmount();
        await expect(
            stton.connect(bob).transfer(alice.address, amount2Shares.div(2))
        ).to.be.revertedWithCustomError(stton, "ZeroShares");

        const balA = await stton.balanceOf(alice.address);
        const balB = await stton.balanceOf(bob.address);
        await stton.connect(bob).transfer(alice.address, balB);
        expect((await stton.balanceOf(alice.address)).div(10).mul(10)).to.equal(
            balA.add(balB).div(10).mul(10)
        );
        expect((await stton.balanceOf(bob.address)).div(2).mul(2)).to.equal(0);
    });
});
