import { ethers, tracer } from "hardhat";
import { deployAndVerify } from "./utils";
const { getContractAt } = ethers;

const config = require("../config.js");
const utils = require("./utils");

const implAddress = "0x1d7FF2589f765317f144C5c741dbF03c498D7f42";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    const networkName = hre.network.name;

    const Impl = await ethers.getContractFactory("StakedTON");
    const impl = await Impl.deploy();
    await impl.deployed();

    if (networkName !== "hardhat" && networkName !== "localhost") {
        console.log("Verifying sTON...");
        try {
            await hre.run("verify:verify", {
                address: impl.address,
            });
            console.log("Contract is Verified");
        } catch (error: any) {
            console.log("Failed in plugin", error.pluginName);
            console.log("Error name", error.name);
            console.log("Error message", error.message);
        }
    }
    console.log("Staked TON implementation address:", impl.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
