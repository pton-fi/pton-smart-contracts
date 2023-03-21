import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@openzeppelin/hardhat-upgrades";
import "solidity-coverage";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "hardhat-abi-exporter";
import "hardhat-spdx-license-identifier";
import "hardhat-tracer";
import "solidity-docgen";

const config = require("./config.js");

module.exports = {
    networks: {
        hardhat: {
            forking: {
                enabled: false,
                url: "https://rpc.ankr.com/eth",
                //blockNumber: 17130449

                // If using blockNumber, RPC node should be archive
            },
        },
        ethereumMainnet: {
            url: "https://rinkeby.infura.io/v3/" + config.infuraIdProject,
            accounts: config.mainnetAccounts,
        },
        ropsten: {
            url: "https://ropsten.infura.io/v3/" + config.infuraIdProject,
            accounts: config.testnetAccounts,
        },
        kovan: {
            url: "https://kovan.infura.io/v3/" + config.infuraIdProject,
            accounts: config.testnetAccounts,
        },
        rinkeby: {
            url: "https://rinkeby.infura.io/v3/" + config.infuraIdProject,
            accounts: config.testnetAccounts,
        },
        goerli: {
            url: "https://goerli.infura.io/v3/" + config.infuraIdProject,
            accounts: config.testnetAccounts,
            gas: 4100000,
            gasPrice: 80000000000,
        },
        bscMainnet: {
            url: "https://bsc-dataseed3.binance.org",
            accounts: config.mainnetAccounts,
        },
        bscTestnet: {
            url: "https://data-seed-prebsc-1-s3.binance.org:8545/",
            accounts: config.testnetAccounts,
        },
        polygonMainnet: {
            url: "https://rpc-mainnet.maticvigil.com",
            accounts: config.mainnetAccounts,
        },
        polygonTestnet: {
            url: "https://matic-mumbai.chainstacklabs.com",
            accounts: config.testnetAccounts,
        },
    },
    // docs: https://www.npmjs.com/package/@nomiclabs/hardhat-etherscan
    etherscan: {
        apiKey: {
            mainnet: config.apiKeyEtherscan,
            ropsten: config.apiKeyEtherscan,
            kovan: config.apiKeyEtherscan,
            rinkeby: config.apiKeyEtherscan,
            goerli: config.apiKeyEtherscan,

            bsc: config.apiKeyBscScan,
            bscTestnet: config.apiKeyBscScan,

            polygon: config.apiKeyPolygonScan,
            polygonMumbai: config.apiKeyPolygonScan,

            // to get all supported networks
            // npx hardhat verify --list-networks
        },
    },
    namedAccounts: {
        deployer: 0,
        alice: 1,
        bob: 2,
        validator: 3,
        pauser: 4,
        oracle: 5,
    },
    solidity: {
        compilers: [
            {
                version: "0.8.17",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.7.6",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.6.12",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    mocha: {
        timeout: 100000,
    },
    // docs: https://www.npmjs.com/package/hardhat-contract-sizer
    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
        disambiguatePaths: false,
        except: ["echidna-test/", "test/", "pancakeSwap/", "@openzeppelin/contracts/"],
    },
    // docs: https://www.npmjs.com/package/hardhat-gas-reporter
    gasReporter: {
        currency: "USD",
        token: "BNB", // ETH, BNB, MATIC, AVAX, HT, MOVR
        coinmarketcap: config.coinmarketcapApi,
        excludeContracts: ["echidna-test/", "pancakeSwap/", "test/", "@openzeppelin/contracts/"],
    },
    // docs: https://www.npmjs.com/package/hardhat-abi-exporter
    abiExporter: {
        path: "./data/abi",
        runOnCompile: true,
        clear: true,
        flat: true,
        spacing: 2,
        except: [],
    },
    spdxLicenseIdentifier: {
        overwrite: true,
        runOnCompile: true,
    },
    // docs: https://www.npmjs.com/package/solidity-docgen
    // config info: https://github.com/OpenZeppelin/solidity-docgen/blob/master/src/config.ts
    docgen: {
        pages: "items",
        exclude: [
            "RfiToken.sol",
            "test/",
            "pancakeSwap/",
            "echidna-test/",
            "@openzeppelin/contracts/",
        ],
    },
} as HardhatUserConfig;
