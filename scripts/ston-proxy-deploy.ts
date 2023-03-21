import { ethers, tracer } from "hardhat";
import { deployAndVerify } from "./utils";
const { getContractAt } = ethers;

const config = require("../config.js");
const utils = require("./utils");

const sTonImplementation = "0x8B13324F5e5eE2b6c3507FA4242867f6993547e3";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    const networkName = hre.network.name;

    const Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const proxy = await Proxy.deploy(sTonImplementation, "0x");
    await proxy.deployed();
    if (networkName !== "hardhat" && networkName !== "localhost") {
        console.log("Verifying sTON...");
        try {
            await hre.run("verify:verify", {
                address: proxy.address,
            });
            console.log("Contract is Verified");
        } catch (error: any) {
            console.log("Failed in plugin", error.pluginName);
            console.log("Error name", error.name);
            console.log("Error message", error.message);
        }
    }
    console.log("Staked TON proxy address:", proxy.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
