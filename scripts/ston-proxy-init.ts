import { ethers, tracer } from "hardhat";
import { deployAndVerify } from "./utils";
const { getContractAt } = ethers;

const config = require("../config.js");
const utils = require("./utils");

const oracleAddress = "0x27378f83e654671484c30107aa8db11a1b299072";
const validatorAddress = "0xe788E8d7201AB98073E646b4dF0C24A0fC5bCa49";
const pauserAddress = "0xa6ae1e312d49529fb66cc384414ef2b8d5a9c673";

const sTonImplementation = "0x8B13324F5e5eE2b6c3507FA4242867f6993547e3";
const sTonProxy = "0x495A0087DDC8eD96F9F1fAeEC11341417F8c48EF";
const pTonImplementation = "0x2a4B650D86b8E3Df9548f7F17185b517c03900af";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Validator address:", validatorAddress);
    console.log("Pauser address:", pauserAddress);
    console.log("Oracle address:", oracleAddress);
    console.log("pTON address:", pTonImplementation);
    const networkName = hre.network.name;

    const implSTON = await getContractAt("StakedTON", sTonProxy);

    await sTon.initialize(
        "Staked TON",
        "stTON",
        oracleAddress,
        validatorAddress,
        pauserAddress,
        pTonImplementation,
        { gasLimit: 1000000 }
    );
    console.log("Staked TON have been initialized");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
