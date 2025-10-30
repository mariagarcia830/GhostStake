import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { GhostStake } from "../types";

describe("GhostStakeSepolia", function () {
  let player: HardhatEthersSigner;
  let contract: GhostStake;
  let contractAddress: string;
  let step = 0;
  let steps = 0;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn("This test suite only runs against Sepolia");
      this.skip();
    }

    try {
      const deployment = await deployments.get("GhostStake");
      contractAddress = deployment.address;
      contract = await ethers.getContractAt("GhostStake", deployment.address);
    } catch (error) {
      (error as Error).message += ". Deploy with 'npx hardhat deploy --network sepolia'";
      throw error;
    }

    const [signer] = await ethers.getSigners();
    player = signer;
  });

  beforeEach(async function () {
    step = 0;
    steps = 0;
  });

  it("claims and stakes Gold on Sepolia", async function () {
    steps = 10;
    this.timeout(4 * 40000);

    await fhevm.initializeCLIApi();

    progress("Reading current encrypted Gold balance...");
    const encryptedBalanceBefore = await contract.getGoldBalance(player.address);

    progress("Decrypting current Gold balance...");
    const currentGold =
      encryptedBalanceBefore === ethers.ZeroHash
        ? 0
        : await fhevm.userDecryptEuint(FhevmType.euint32, encryptedBalanceBefore, contractAddress, player);
    progress(`Gold before claim: ${currentGold}`);

    if (currentGold === 0) {
      progress("Claiming initial Gold...");
      const tx = await contract.connect(player).claimInitialGold();
      await tx.wait();
    } else {
      progress("Initial Gold already claimed, skipping claim step");
    }

    progress("Fetching encrypted Gold balance...");
    const encryptedAfterClaim = await contract.getGoldBalance(player.address);

    progress("Decrypting Gold balance after claim...");
    const goldAfterClaim =
      encryptedAfterClaim === ethers.ZeroHash
        ? 0
        : await fhevm.userDecryptEuint(FhevmType.euint32, encryptedAfterClaim, contractAddress, player);
    progress(`Gold after claim: ${goldAfterClaim}`);

    expect(goldAfterClaim).to.be.at.least(100);

    progress("Encrypting stake amount...");
    const encryptedStakeInput = await fhevm.createEncryptedInput(contractAddress, player.address).add32(10).encrypt();

    progress("Staking encrypted Gold...");
    const stakeTx = await contract
      .connect(player)
      .stakeGold(encryptedStakeInput.handles[0], encryptedStakeInput.inputProof);
    await stakeTx.wait();

    progress("Decrypting balances after stake...");
    const encryptedBalancePostStake = await contract.getGoldBalance(player.address);
    const encryptedStakeBalance = await contract.getStakedBalance(player.address);

    const goldPostStake =
      encryptedBalancePostStake === ethers.ZeroHash
        ? 0
        : await fhevm.userDecryptEuint(FhevmType.euint32, encryptedBalancePostStake, contractAddress, player);
    const stakedPostStake =
      encryptedStakeBalance === ethers.ZeroHash
        ? 0
        : await fhevm.userDecryptEuint(FhevmType.euint32, encryptedStakeBalance, contractAddress, player);

    progress(`Gold after stake: ${goldPostStake}`);
    progress(`Staked balance  : ${stakedPostStake}`);

    expect(stakedPostStake).to.be.at.least(10);
    expect(goldPostStake + stakedPostStake).to.eq(goldAfterClaim);
  });
});
