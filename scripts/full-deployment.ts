import { ethers, tracer } from "hardhat";
import { deployAndVerify } from "./utils";
const { getContractAt } = ethers;

const utils = require("./utils");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const stTONImpl = await utils.deployAndVerify("stTON", []);
    console.log("stTON implementation address:", stTONImpl.address);

    const stTON = await utils.deployAndVerify("ERC1967Proxy", [stTONImpl.address, "0x"]);
    console.log("stTON address:", stTON.address);

    const pTON = await utils.deployAndVerify("pTON", ["pTON", "pTON", stTON.address]);
    console.log("pTON address:", pTON.address);

    // Mainnet
    // const oracleAddress = "0x1B2cB8A3494f79Be22C2E60A936F96f6863C9818";
    // const validator1Address = "0x1b855415179009e56946fDbC958e077966cF8650";
    // const validator2Address = "0x8E5479BA8C9dF8FaD26f0C1B625824675f2eD284";
    // const validator3Address = "0x88903de04A8BBB623f25252849C543B8a0b7a5a5";
    // const pauserAddress = "0xDBB09C654Ac72D794BAFBfE0bDad568582dB8e5e";

    // Testnet
    const oracleAddress = "0x27378f83e654671484c30107aa8db11a1b299072";
    const validator1Address = "0xe788E8d7201AB98073E646b4dF0C24A0fC5bCa49";
    const validator2Address = "0xabe214336c1200F210061f2Be5956fC4963D8cB4";
    const validator3Address = "0x42b0bD23375FC3Ca5e1399e874C4407a5EcEaFc0";
    const pauserAddress = "0xa6ae1e312d49529fb66cc384414ef2b8d5a9c673";

    const stTONProxified = await getContractAt("stTON", stTON.address);
    await stTONProxified.initialize(
        "stTON",
        "stTON",
        oracleAddress,
        validator1Address,
        validator2Address,
        validator3Address,
        pauserAddress,
        pTON.address,
    );
    console.log("stTON have been initialized");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
