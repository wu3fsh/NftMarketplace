import { task } from "hardhat/config";

task("create", "Create an item")
  .addParam('marketplace', "The address of the marketplace contract")
  .addParam('uri', "The tokenUri id of the item")
  .addParam('owner', "The owner of the item")
  .addParam('id', "The token id of the item")
  .setAction(async (taskArgs, hre) => {
    const marketplaceAddress = taskArgs.marketplace;
    const tokenUri = taskArgs.uri;
    const owner = taskArgs.owner;
    const tokenId = taskArgs.id;
    const marketplaceFactory = await hre.ethers.getContractFactory('NftMarketplace');
    const marketplace = marketplaceFactory.attach(marketplaceAddress);
    await marketplace.createItem(tokenUri, owner, tokenId);

    console.log("Done");
  });