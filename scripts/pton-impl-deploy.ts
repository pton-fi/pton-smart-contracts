import { ethers } from "hardhat";
import { deployAndVerify } from "./utils";
const { getContractAt } = ethers;

const config = require("../config.js");
const utils = require("./utils");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    const networkName = hre.network.name;

    const stTonProxy = "0x0fB2E7c2d2754476aAa84762e44d3EE328AA9Ea2";

    const PTON = await ethers.getContractFactory("pTON");
    const pTon = await PTON.deploy("pTON", "pTON", stTonProxy);
    await pTon.deployed();

    if (networkName !== "hardhat" && networkName !== "localhost") {
        console.log("Verifying pTON...");
        await pTon.deployTransaction.wait(2);
        try {
            await hre.run("verify:verify", {
                address: pTon.address,
            });
            console.log("Contract is Verified");
        } catch (error: any) {
            console.log("Failed in plugin", error.pluginName);
            console.log("Error name", error.name);
            console.log("Error message", error.message);
        }
    }
    console.log("pTON address:", pTon.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
