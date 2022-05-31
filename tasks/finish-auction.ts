import { task } from "hardhat/config";

task("finish", "Finish the auction")
  .addParam('marketplace', "The address of the marketplace contract")
  .addParam('id', "The token id of the item")
  .setAction(async (taskArgs, hre) => {
    const marketplaceAddress = taskArgs.marketplace;
    const tokenId = taskArgs.id;
    const marketplaceFactory = await hre.ethers.getContractFactory('NftMarketplace');
    const marketplace = marketplaceFactory.attach(marketplaceAddress);
    await marketplace.finishAuction(tokenId);

    console.log("Done");
  });