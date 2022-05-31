import { task } from "hardhat/config";

task("list", "List an item")
  .addParam('marketplace', "The address of the marketplace contract")
  .addParam('id', "The token id of the item")
  .addParam('price', "Price of the item")
  .setAction(async (taskArgs, hre) => {
    const marketplaceAddress = taskArgs.marketplace;
    const tokenId = taskArgs.id;
    const price = taskArgs.price;
    const marketplaceFactory = await hre.ethers.getContractFactory('NftMarketplace');
    const marketplace = marketplaceFactory.attach(marketplaceAddress);
    await marketplace.listItem(tokenId, price);

    console.log("Done");
  });