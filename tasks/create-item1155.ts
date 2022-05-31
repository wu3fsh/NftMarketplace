import { task } from "hardhat/config";

task("create-1155", "Create an item")
  .addParam('marketplace', "The address of the marketplace contract")
  .addParam('uri', "The tokenUri id of the item")
  .addParam('owner', "The owner of the item")
  .addParam('id', "The token id of the item")
  .addParam('amount', "The amount of the items")
  .setAction(async (taskArgs, hre) => {
    const marketplaceAddress = taskArgs.marketplace;
    const tokenUri = taskArgs.uri;
    const owner = taskArgs.owner;
    const tokenId = taskArgs.id;
    const amount = taskArgs.amount;
    const marketplaceFactory = await hre.ethers.getContractFactory('NftMarketplace');
    const marketplace = marketplaceFactory.attach(marketplaceAddress);
    await marketplace.createItem1155(tokenUri, owner, tokenId, amount);

    console.log("Done");
  });