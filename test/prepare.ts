import { ethers, tracer, upgrades } from "hardhat";
import { BigNumber, Contract } from "ethers";
const { getSigners, getContractAt } = ethers;
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

// Constants
const nameS = "stTON";
const symbolS = "stTON";

const nameP = "pTON";
const symbolP = "pTON";

export interface prepareEnvResult {
    stton: Contract;
    pton: Contract;

    owner: SignerWithAddress;
    alice: SignerWithAddress;
    bob: SignerWithAddress;
    oracle: SignerWithAddress;
    validator1: SignerWithAddress;
    validator2: SignerWithAddress;
    validator3: SignerWithAddress;
    pauser: SignerWithAddress;
}

export interface MintInfoInterface {
    amountUnderlying: BigNumber | string;
    to: string;
}

export async function prepareEnv(): Promise<prepareEnvResult> {
    const [owner, alice, bob, oracle, pauser, validator1, validator2, validator3] =
        await getSigners();

    const Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const STTON = await ethers.getContractFactory("stTON");
    const stton_impl = await STTON.deploy();
    const stton_proxy = await Proxy.deploy(stton_impl.address, "0x");
    const PTON = await ethers.getContractFactory("pTON");
    const pton = await PTON.deploy(nameP, symbolP, stton_proxy.address);
    const stton = await STTON.attach(stton_proxy.address);
    await stton.initialize(
        nameS,
        symbolS,
        oracle.address,
        validator1.address,
        validator2.address,
        validator3.address,
        pauser.address,
        pton.address
    );

    tracer.nameTags[owner.address] = "owner";
    tracer.nameTags[alice.address] = "alice";
    tracer.nameTags[bob.address] = "bob";
    tracer.nameTags[pauser.address] = "pauser";
    tracer.nameTags[oracle.address] = "oracle";
    tracer.nameTags[validator1.address] = "validator1";
    tracer.nameTags[validator2.address] = "validator2";
    tracer.nameTags[validator3.address] = "validator3";
    tracer.nameTags[stton.address] = "stton";
    tracer.nameTags[pton.address] = "pton";

    return {
        stton,
        pton,

        owner,
        alice,
        bob,
        oracle,
        validator1,
        validator2,
        validator3,
        pauser,
    };
}
