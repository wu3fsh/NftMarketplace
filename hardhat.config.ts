import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";
import "dotenv/config";
import "./tasks/approve20";
import "./tasks/approve721";
import "./tasks/approve1155";
import "./tasks/buy-item";
import "./tasks/buy-item1155";
import "./tasks/cancel";
import "./tasks/cancel1155";
import "./tasks/create-item";
import "./tasks/create-item1155";
import "./tasks/finish-auction";
import "./tasks/finish-auction1155";
import "./tasks/list-auction";
import "./tasks/list-auction1155";
import "./tasks/list-item";
import "./tasks/list-item1155";
import "./tasks/make-bid";
import "./tasks/make-bid1155";

module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`${process.env.RINKEBY_PRIVATE_KEY}`, `${process.env.RINKEBY_PRIVATE_KEY_SECOND_ACC}`],
      gas: 5000_000,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
