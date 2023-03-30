import { ethers } from "hardhat";
import { deployAndVerify } from "./utils";
const { getContractAt } = ethers;

const config = require("../config.js");
const utils = require("./utils");

const stTonImplementation = "0x21Bc76e5c88f4182677da0BbB07F57a1Cd18F6c6";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    const networkName = hre.network.name;

    const Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const proxy = await Proxy.deploy(stTonImplementation, "0x");
    await proxy.deployed();
    if (networkName !== "hardhat" && networkName !== "localhost") {
        console.log("Verifying stTON proxy...");
        await proxy.deployTransaction.wait(2);
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
    console.log("stTON proxy address:", proxy.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
