import { task } from "hardhat/config";

task("buy", "Buy an item from the list")
  .addParam('marketplace', "The address of the marketplace contract")
  .addParam('id', "The token id of the item")
  .setAction(async (taskArgs, hre) => {
    const marketplaceAddress = taskArgs.marketplace;
    const tokenId = taskArgs.id;
    const accounts = await hre.ethers.getSigners();
    const marketplaceFactory = await hre.ethers.getContractFactory('NftMarketplace');
    const marketplace = marketplaceFactory.attach(marketplaceAddress);
    await marketplace.connect(accounts[1]).buyItem(tokenId);

    console.log("Done");
  });