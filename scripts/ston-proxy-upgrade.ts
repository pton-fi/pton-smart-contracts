import { ethers, upgrades } from "hardhat";
const { getContractAt } = ethers;

const config = require("../config.js");

const oracleAddress = "0x27378f83e654671484c30107aa8db11a1b299072";
const validatorAddress = "0xe788E8d7201AB98073E646b4dF0C24A0fC5bCa49";
const pauserAddress = "0xa6ae1e312d49529fb66cc384414ef2b8d5a9c673";

const sTonImplementation1 = "0x8B13324F5e5eE2b6c3507FA4242867f6993547e3";
const sTonImplementation2 = "0x2F33aF500f497B6e118F1453eca382c8DC4F1bc9";
const sTonImplementation3 = "0x30b0DBC3d95423Dc6d8695062657d18712955060";
const sTonImplLatest = "0x1d7FF2589f765317f144C5c741dbF03c498D7f42";
const sTonProxy = "0x495A0087DDC8eD96F9F1fAeEC11341417F8c48EF";
const pTonImplementation = "0x2a4B650D86b8E3Df9548f7F17185b517c03900af";

async function main() {
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;

    const sTon = await getContractAt("StakedTON", sTonProxy);

    await sTon.upgradeTo(sTonImplLatest);
    console.log("Upgrade successful");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
