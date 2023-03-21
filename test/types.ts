import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export interface prepareEnvResult {
    instance: Contract;

    owner: SignerWithAddress;
    alice: SignerWithAddress;
    bob: SignerWithAddress;
    oracle: SignerWithAddress;
    validator: SignerWithAddress;
    pauser: SignerWithAddress;
}

export interface prepareEnvResultP {
    stton: Contract;
    piton: Contract;

    owner: SignerWithAddress;
    alice: SignerWithAddress;
    bob: SignerWithAddress;
    oracle: SignerWithAddress;
    validator: SignerWithAddress;
    pauser: SignerWithAddress;
}

export interface MintInfoInterface {
    amountUnderlying: BigNumber | string;
    to: string;
}
