import { ethers } from "hardhat";
import { deployAndVerify } from "./utils";
const { getContractAt } = ethers;

const utils = require("../utils");

const impl_address = "0x41f96A35E6163C97B85227471337A5b1ddb3271E";

async function main() {
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;

    if (networkName !== "hardhat" && networkName !== "localhost") {
        console.log("Verifying...");
        try {
            await hre.run("verify:verify", {
                address: impl_address,
                constructorArguments: [
                ]
            });
            console.log("Contract is Verified");
        } catch (error: any) {
            console.log("Failed in plugin", error.pluginName);
            console.log("Error name", error.name);
            console.log("Error message", error.message);
        }
    }
    console.log("Verified address:", impl_address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
