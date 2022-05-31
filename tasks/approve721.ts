import { task } from "hardhat/config";

task("approve721", "Set an allowance address and an allowance amount tokens to transfer from your behalf")
  .addParam('address', "The erc721 token address")
  .addParam('spender', "The address that will be allowed to transfer your tokens")
  .addParam('id', "The token id")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractFactory('ERC721Token');
    const token = contract.attach(taskArgs.address!);
    await token.approve(taskArgs.spender, taskArgs.id);
    console.log("Done");
  });