import { task } from "hardhat/config";

task("make-bid-1155", "Make a bid on the auction")
  .addParam('marketplace', "The address of the marketplace contract")
  .addParam('id', "The token id of the item")
  .addParam('price', "Price of the item")
  .setAction(async (taskArgs, hre) => {
    const marketplaceAddress = taskArgs.marketplace;
    const tokenId = taskArgs.id;
    const price = taskArgs.price;
    const marketplaceFactory = await hre.ethers.getContractFactory('NftMarketplace');
    const marketplace = marketplaceFactory.attach(marketplaceAddress);
    const accounts = await hre.ethers.getSigners();
    await marketplace.connect(accounts[1]).makeBid1155(tokenId, price);

    console.log("Done");
  });