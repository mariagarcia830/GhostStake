import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { ethers } from "ethers";

task("task:address", "Prints the GhostStake address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const deployment = await deployments.get("GhostStake");

  console.log("GhostStake address is " + deployment.address);
});

task("task:claim", "Calls the claimInitialGold() function")
  .addOptionalParam("address", "Optional GhostStake contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers: hreEthers } = hre;

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get("GhostStake");

    const signers = await hreEthers.getSigners();
    const contract = await hreEthers.getContractAt("GhostStake", deployment.address);

    const tx = await contract.connect(signers[0]).claimInitialGold();
    console.log(`Wait for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);
  });

task("task:decrypt-balances", "Decrypts wallet balance, staked balance, and last action status")
  .addOptionalParam("address", "Optional GhostStake contract address")
  .addOptionalParam("player", "Player address to inspect")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers: hreEthers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get("GhostStake");
    const playerAddress = taskArguments.player || (await hreEthers.getSigners())[0].address;

    console.log(`GhostStake: ${deployment.address}`);
    console.log(`Player    : ${playerAddress}`);

    const contract = await hreEthers.getContractAt("GhostStake", deployment.address);
    const signer = await hreEthers.getSigner(playerAddress);

    const encryptedBalance = await contract.getGoldBalance(playerAddress);
    const encryptedStake = await contract.getStakedBalance(playerAddress);
    const encryptedStatus = await contract.getLastActionStatus(playerAddress);

    const balance =
      encryptedBalance === ethers.ZeroHash
        ? 0
        : await fhevm.userDecryptEuint(FhevmType.euint32, encryptedBalance, deployment.address, signer);
    const stake =
      encryptedStake === ethers.ZeroHash
        ? 0
        : await fhevm.userDecryptEuint(FhevmType.euint32, encryptedStake, deployment.address, signer);
    const status =
      encryptedStatus === ethers.ZeroHash
        ? 0
        : await fhevm.userDecryptEuint(FhevmType.euint32, encryptedStatus, deployment.address, signer);

    console.log(`Gold balance : ${balance}`);
    console.log(`Staked Gold  : ${stake}`);
    console.log(`Status code  : ${status}`);
  });

task("task:stake", "Stakes an encrypted amount of Gold")
  .addParam("value", "The amount of Gold to stake (uint32)")
  .addOptionalParam("address", "Optional GhostStake contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers: hreEthers, fhevm } = hre;

    const value = parseInt(taskArguments.value);
    if (!Number.isInteger(value) || value < 0) {
      throw new Error("--value must be a non-negative integer");
    }

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get("GhostStake");
    console.log(`GhostStake: ${deployment.address}`);

    const signers = await hreEthers.getSigners();
    const contract = await hreEthers.getContractAt("GhostStake", deployment.address);

    const encryptedInput = await fhevm
      .createEncryptedInput(deployment.address, signers[0].address)
      .add32(value)
      .encrypt();

    const tx = await contract.connect(signers[0]).stakeGold(encryptedInput.handles[0], encryptedInput.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);
  });

task("task:withdraw", "Withdraws an encrypted amount of staked Gold")
  .addParam("value", "The amount of Gold to withdraw (uint32)")
  .addOptionalParam("address", "Optional GhostStake contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers: hreEthers, fhevm } = hre;

    const value = parseInt(taskArguments.value);
    if (!Number.isInteger(value) || value < 0) {
      throw new Error("--value must be a non-negative integer");
    }

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get("GhostStake");
    console.log(`GhostStake: ${deployment.address}`);

    const signers = await hreEthers.getSigners();
    const contract = await hreEthers.getContractAt("GhostStake", deployment.address);

    const encryptedInput = await fhevm
      .createEncryptedInput(deployment.address, signers[0].address)
      .add32(value)
      .encrypt();

    const tx = await contract
      .connect(signers[0])
      .withdrawStakedGold(encryptedInput.handles[0], encryptedInput.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);
  });
