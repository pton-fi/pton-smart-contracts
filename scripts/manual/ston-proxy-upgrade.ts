import { ethers, upgrades } from "hardhat";
const { getContractAt } = ethers;

const sTonImplPrevious = "0x21Bc76e5c88f4182677da0BbB07F57a1Cd18F6c6";
const sTonImplLatest = "0x21Bc76e5c88f4182677da0BbB07F57a1Cd18F6c6";

const sTonProxy = "0x0fB2E7c2d2754476aAa84762e44d3EE328AA9Ea2";

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
