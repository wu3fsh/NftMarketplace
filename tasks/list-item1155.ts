import { task } from "hardhat/config";

task("list-1155", "List an item")
  .addParam('marketplace', "The address of the marketplace contract")
  .addParam('id', "The token id of the item")
  .addParam('price', "Price of the item")
  .addParam('amount', "The amount of the items")
  .setAction(async (taskArgs, hre) => {
    const marketplaceAddress = taskArgs.marketplace;
    const tokenId = taskArgs.id;
    const price = taskArgs.price;
    const amount = taskArgs.amount;
    const marketplaceFactory = await hre.ethers.getContractFactory('NftMarketplace');
    const marketplace = marketplaceFactory.attach(marketplaceAddress);
    await marketplace.listItem1155(tokenId, price, amount);

    console.log("Done");
  });