import { task } from "hardhat/config";

task("list-auction", "List an item for auction")
  .addParam('marketplace', "The address of the marketplace contract")
  .addParam('id', "The token id of the item")
  .addParam('price', "Min price of the item")
  .setAction(async (taskArgs, hre) => {
    const marketplaceAddress = taskArgs.marketplace;
    const tokenId = taskArgs.id;
    const price = taskArgs.price;
    const marketplaceFactory = await hre.ethers.getContractFactory('NftMarketplace');
    const marketplace = marketplaceFactory.attach(marketplaceAddress);
    await marketplace.listItemOnAuction(tokenId, price);

    console.log("Done");
  });