import { ethers } from "hardhat";
import { deployAndVerify } from "./utils";
const { getContractAt } = ethers;

const config = require("../config.js");
const utils = require("./utils");

const oracleAddress = "0x1B2cB8A3494f79Be22C2E60A936F96f6863C9818";
const validator1Address = "0x1b855415179009e56946fDbC958e077966cF8650";
const validator2Address = "0x8E5479BA8C9dF8FaD26f0C1B625824675f2eD284";
const validator3Address = "0x88903de04A8BBB623f25252849C543B8a0b7a5a5";
const pauserAddress = "0xDBB09C654Ac72D794BAFBfE0bDad568582dB8e5e";

const stTonImplementation = "0x21Bc76e5c88f4182677da0BbB07F57a1Cd18F6c6";
const stTonProxy = "0x0fB2E7c2d2754476aAa84762e44d3EE328AA9Ea2";
const pTonImplementation = "0x6256aB9480B84Cf70d75773121C0523F87B0D588";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Validator1 address:", validator1Address);
    console.log("Validator2 address:", validator2Address);
    console.log("Validator3 address:", validator3Address);
    console.log("Pauser address:", pauserAddress);
    console.log("Oracle address:", oracleAddress);
    console.log("pTON address:", pTonImplementation);
    const networkName = hre.network.name;

    const stTON = await getContractAt("stTON", stTonProxy);

    await stTON.initialize(
        "stTON",
        "stTON",
        oracleAddress,
        validator1Address,
        validator2Address,
        validator3Address,
        pauserAddress,
        pTonImplementation,
        { gasLimit: 3000000 }
    );
    console.log("stTON have been initialized");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
