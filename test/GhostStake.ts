import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { GhostStake, GhostStake__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("GhostStake")) as GhostStake__factory;
  const contract = (await factory.deploy()) as GhostStake;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

async function decryptValue(
  ciphertext: string,
  contractAddress: string,
  signer: HardhatEthersSigner,
) {
  if (ciphertext === ethers.ZeroHash) {
    return 0;
  }

  return fhevm.userDecryptEuint(FhevmType.euint32, ciphertext, contractAddress, signer);
}

describe("GhostStake", function () {
  let signers: Signers;
  let contract: GhostStake;
  let contractAddress: string;

  before(async function () {
    const [deployer, alice, bob] = await ethers.getSigners();
    signers = { deployer, alice, bob };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This test suite must run in the local FHEVM mock");
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  it("starts with zero balances", async function () {
    const gold = await contract.getGoldBalance(signers.alice.address);
    const staked = await contract.getStakedBalance(signers.alice.address);

    expect(gold).to.eq(ethers.ZeroHash);
    expect(staked).to.eq(ethers.ZeroHash);
  });

  it("allows players to claim 100 Gold exactly once", async function () {
    await contract.connect(signers.alice).claimInitialGold();

    const gold = await contract.getGoldBalance(signers.alice.address);
    const status = await contract.getLastActionStatus(signers.alice.address);

    const clearGold = await decryptValue(gold, contractAddress, signers.alice);
    const clearStatus = await decryptValue(status, contractAddress, signers.alice);

    expect(clearGold).to.eq(100);
    expect(clearStatus).to.eq(0);

    await expect(contract.connect(signers.alice).claimInitialGold()).to.be.revertedWith("Gold already claimed");
  });

  it("stakes encrypted Gold and updates balances", async function () {
    await contract.connect(signers.alice).claimInitialGold();

    const stakeInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(40)
      .encrypt();

    await contract.connect(signers.alice).stakeGold(stakeInput.handles[0], stakeInput.inputProof);

    const gold = await contract.getGoldBalance(signers.alice.address);
    const staked = await contract.getStakedBalance(signers.alice.address);
    const status = await contract.getLastActionStatus(signers.alice.address);

    const clearGold = await decryptValue(gold, contractAddress, signers.alice);
    const clearStaked = await decryptValue(staked, contractAddress, signers.alice);
    const clearStatus = await decryptValue(status, contractAddress, signers.alice);

    expect(clearGold).to.eq(60);
    expect(clearStaked).to.eq(40);
    expect(clearStatus).to.eq(0);
  });

  it("rejects staking more Gold than available", async function () {
    await contract.connect(signers.alice).claimInitialGold();

    const stakeInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(150)
      .encrypt();

    await contract.connect(signers.alice).stakeGold(stakeInput.handles[0], stakeInput.inputProof);

    const gold = await contract.getGoldBalance(signers.alice.address);
    const staked = await contract.getStakedBalance(signers.alice.address);
    const status = await contract.getLastActionStatus(signers.alice.address);

    const clearGold = await decryptValue(gold, contractAddress, signers.alice);
    const clearStaked = await decryptValue(staked, contractAddress, signers.alice);
    const clearStatus = await decryptValue(status, contractAddress, signers.alice);

    expect(clearGold).to.eq(100);
    expect(clearStaked).to.eq(0);
    expect(clearStatus).to.eq(1);
  });

  it("withdraws staked Gold with encrypted amounts", async function () {
    await contract.connect(signers.alice).claimInitialGold();

    const stakeInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(60)
      .encrypt();
    await contract.connect(signers.alice).stakeGold(stakeInput.handles[0], stakeInput.inputProof);

    const withdrawInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(20)
      .encrypt();
    await contract.connect(signers.alice).withdrawStakedGold(withdrawInput.handles[0], withdrawInput.inputProof);

    const gold = await contract.getGoldBalance(signers.alice.address);
    const staked = await contract.getStakedBalance(signers.alice.address);
    const status = await contract.getLastActionStatus(signers.alice.address);

    const clearGold = await decryptValue(gold, contractAddress, signers.alice);
    const clearStaked = await decryptValue(staked, contractAddress, signers.alice);
    const clearStatus = await decryptValue(status, contractAddress, signers.alice);

    expect(clearGold).to.eq(60);
    expect(clearStaked).to.eq(40);
    expect(clearStatus).to.eq(0);
  });

  it("blocks withdrawing more Gold than staked", async function () {
    await contract.connect(signers.alice).claimInitialGold();

    const stakeInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(50)
      .encrypt();
    await contract.connect(signers.alice).stakeGold(stakeInput.handles[0], stakeInput.inputProof);

    const withdrawInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(80)
      .encrypt();
    await contract.connect(signers.alice).withdrawStakedGold(withdrawInput.handles[0], withdrawInput.inputProof);

    const gold = await contract.getGoldBalance(signers.alice.address);
    const staked = await contract.getStakedBalance(signers.alice.address);
    const status = await contract.getLastActionStatus(signers.alice.address);

    const clearGold = await decryptValue(gold, contractAddress, signers.alice);
    const clearStaked = await decryptValue(staked, contractAddress, signers.alice);
    const clearStatus = await decryptValue(status, contractAddress, signers.alice);

    expect(clearGold).to.eq(50);
    expect(clearStaked).to.eq(50);
    expect(clearStatus).to.eq(2);
  });
});
