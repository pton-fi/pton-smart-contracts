import { BigNumber, Contract } from "ethers";
import { MintInfoInterface } from "./types";

export const mintCalldata = (contract: Contract, mintInfo: MintInfoInterface[]) => {
    const calldatas: string[] = [];
    mintInfo.forEach(({ to, amountUnderlying }) =>
        calldatas.push(contract.interface.encodeFunctionData("mint", [to, amountUnderlying]))
    );
    return calldatas;
};
