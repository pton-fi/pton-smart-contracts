import { expect } from "chai";
import { prepareEnv } from "./prepare";
const { parseEther } = ethers.utils;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Testing stTON rewards distribution functions", function () {
    it("Rewarding test", async () => {
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
        const amountR = amountA.mul(2).div(100);
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

        const amountB = parseEther("0.000001");
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
                amount: amountB,
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
                amount: amountB,
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
                amount: amountB,
                salt: salt2,
            }
        );
        const sigB = [sigB1, sigB2, sigB3];
        await stton.connect(bob).mint(bob.address, amountB, salt2, sigB);

        await stton.connect(oracle).updateRewards(amountR, one_day);
        let balB = await stton.balanceOf(bob.address);
        let balA = await stton.balanceOf(alice.address);
        expect(balB).to.equal(amountB.sub(1));
        expect(balA).to.equal(amountA.add(amountR).sub(1));
        await time.increase(one_day);

        const shareOfBob = amountB.mul(amountA).div(amountA.add(amountR).sub(1));
        balA = await stton.balanceOf(alice.address);
        balB = await stton.balanceOf(bob.address);
        const totalSupply = await stton.totalSupply();
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
        const rounding = parseEther("0.000001");
        const amountR = amountA.div(10);
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
        await time.increase(one_day / 2);

        const amountB = amountA;
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
                amount: amountB,
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
                amount: amountB,
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
                amount: amountB,
                salt: salt2,
            }
        );
        const sigB = [sigB1, sigB2, sigB3];
        await stton.connect(bob).mint(bob.address, amountB, salt2, sigB);

        await stton.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day);

        const shareOfBob = amountA.mul(amountA).div(amountA.add(amountR.div(2)).sub(1));
        const balA = await stton.balanceOf(alice.address);
        const balB = await stton.balanceOf(bob.address);
        const totalSupply = await stton.totalSupply();

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
        const chainId = 31337;
        const name = await stton.name();
        const version = "1";
        const verifyingContract = stton.address;
        const salt1 = "0x0000000000000000000000000000000000000000000000000000000000000001";
        const salt2 = "0x0000000000000000000000000000000000000000000000000000000000000002";
        const salt3 = "0x0000000000000000000000000000000000000000000000000000000000000003";
        const salt4 = "0x0000000000000000000000000000000000000000000000000000000000000004";

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

        const amountB = amountA;
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
                amount: amountB,
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
                amount: amountB,
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
                amount: amountB,
                salt: salt2,
            }
        );
        const sigB = [sigB1, sigB2, sigB3];
        await stton.connect(bob).mint(bob.address, amountB, salt2, sigB);

        await stton.connect(oracle).updateRewards(amountR, one_day);
        await time.increase(one_day);

        const amountO = amountA;
        const sigO1 = await validator1._signTypedData(
            { name, version, chainId, verifyingContract },
            {
                Validate: [
                    { name: "to", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "salt", type: "bytes32" },
                ],
            },
            {
                to: owner.address,
                amount: amountO,
                salt: salt3,
            }
        );
        const sigO2 = await validator2._signTypedData(
            { name, version, chainId, verifyingContract },
            {
                Validate: [
                    { name: "to", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "salt", type: "bytes32" },
                ],
            },
            {
                to: owner.address,
                amount: amountO,
                salt: salt3,
            }
        );
        const sigO3 = await validator3._signTypedData(
            { name, version, chainId, verifyingContract },
            {
                Validate: [
                    { name: "to", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "salt", type: "bytes32" },
                ],
            },
            {
                to: owner.address,
                amount: amountO,
                salt: salt3,
            }
        );
        const sigO = [sigO1, sigO2, sigO3];
        await stton.connect(bob).mint(owner.address, amountO, salt3, sigO);

        const burn = "burn(uint256,bytes)";
        const addressTONeasy = ethers.utils.toUtf8Bytes(
            "kf_8uRo6OBbQ97jCx2EIuKm8Wmt6Vb15-KsQHFLbKSMiYIny"
        );
        let balB = await stton.balanceOf(bob.address);
        let balO = await stton.balanceOf(owner.address);
        let balA = await stton.balanceOf(alice.address);
        await stton.connect(alice)[burn](balA, addressTONeasy);

        const sigAA1 = await validator1._signTypedData(
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
                amount: balA,
                salt: salt4,
            }
        );
        const sigAA2 = await validator2._signTypedData(
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
                amount: balA,
                salt: salt4,
            }
        );
        const sigAA3 = await validator3._signTypedData(
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
                amount: balA,
                salt: salt4,
            }
        );
        const sigAA = [sigAA1, sigAA2, sigAA3];
        await stton.connect(alice).mint(alice.address, balA, salt4, sigAA);

        expect(await stton.balanceOf(bob.address)).to.equal(balB);
        expect((await stton.balanceOf(alice.address)).div(10).mul(10)).to.equal(
            balA.div(10).mul(10)
        );
        expect(await stton.balanceOf(owner.address)).to.equal(balO);
    });
});
