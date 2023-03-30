import { ethers } from "hardhat";
import { deployAndVerify } from "./utils";
const { getContractAt } = ethers;

const config = require("../config.js");
const utils = require("./utils");

const impl_address = "0xd00C63F5D667AD1A153Bbd278Ad19a52A4fAb934";

async function main() {
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;

    if (networkName !== "hardhat" && networkName !== "localhost") {
        console.log("Verifying...");
        try {
            await hre.run("verify:verify", {
                address: impl_address,
                constructorArguments: [
                    'pTON',
                    'pTON',
                    '0x9Ac34Ae030Af089A421FbB09cAbC48184B15FEEa'
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
