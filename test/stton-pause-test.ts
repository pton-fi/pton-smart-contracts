import { expect } from "chai";
import { prepareEnv } from "./prepare";
const { getSigners } = ethers;
const { parseEther } = ethers.utils;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Testing stTON pausable functions", function () {
    it("Pausing test", async () => {
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
        const pauserRole = await stton.PAUSER_ROLE();
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
        await stton.connect(alice).transfer(bob.address, amountR);

        const lowerOwnerAddress = owner.address.toString().toLowerCase();
        await expect(stton.connect(owner).setPause(true)).to.be.revertedWith(
            `AccessControl: account ${lowerOwnerAddress} is missing role ${pauserRole}`
        );

        await stton.connect(pauser).setPause(true);

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

        await expect(stton.connect(bob).mint(bob.address, amountA, salt2, sigB)).to.be.revertedWith(
            "Pausable: paused"
        );

        await expect(stton.connect(oracle).updateRewards(amountR, one_day)).to.be.revertedWith(
            "Pausable: paused"
        );

        await expect(stton.connect(alice).transfer(bob.address, amountR)).to.be.revertedWith(
            "Pausable: paused"
        );

        await expect(stton.connect(pauser).setPause(true)).to.be.revertedWith("Pausable: paused");

        await stton.connect(pauser).setPause(false);
        await stton.connect(bob).mint(bob.address, amountA, salt2, sigB);
        await stton.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day);
        await stton.connect(alice).transfer(bob.address, amountR);
    });
});
