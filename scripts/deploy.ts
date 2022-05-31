import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  console.log('Account balance:', (await deployer.getBalance()).toString());

  const factory = await ethers.getContractFactory('NftMarketplace');
  const nftMarketplace = await factory.deploy(process.env.ERC20_TOKEN_ADDRESS, process.env.ERC721_TOKEN_ADDRESS, process.env.ERC1155_TOKEN_ADDRESS, process.env.AUCTION_DURATION_SEC);

  console.log('NftMarketplace address:', nftMarketplace.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
