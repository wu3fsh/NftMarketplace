import { task } from "hardhat/config";

task("approve20", "Set an allowance address and an allowance amount tokens to transfer from your behalf")
  .addParam('address', "The erc20 token address")
  .addParam('spender', "The address that will be allowed to transfer your tokens")
  .addParam('amount', "Tokens amount")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractFactory('ERC20Token');
    const token = contract.attach(taskArgs.address!);
    const accounts = await hre.ethers.getSigners();
    await token.connect(accounts[1]).approve(taskArgs.spender, taskArgs.amount);
    console.log("Done");
  });