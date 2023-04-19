import { ethers, upgrades } from "hardhat";
const { getContractAt } = ethers;

const sTonImplPrevious = "0x21Bc76e5c88f4182677da0BbB07F57a1Cd18F6c6";
const sTonImplLatest = "0x21Bc76e5c88f4182677da0BbB07F57a1Cd18F6c6";

const sTonProxy = "0x21827cB7Df5b9a6b5b7323B6Ce2f0338f9ccA86E";

async function main() {
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name;

    const sTon = await getContractAt("stTON", sTonProxy);

    await sTon.upgradeTo(sTonImplLatest);
    console.log("Upgrade successful");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
