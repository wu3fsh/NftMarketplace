import { task } from "hardhat/config";

task("approve1155", "Set an allowance address and an allowance amount tokens to transfer from your behalf")
  .addParam('address', "The erc1155 token address")
  .addParam('spender', "The address that will be allowed to transfer your tokens")
  .addParam('approved', "Is approved?")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractFactory('ERC1155Token');
    const token = contract.attach(taskArgs.address!);
    await token.setApprovalForAll(taskArgs.spender, taskArgs.approved);
    console.log("Done");
  });