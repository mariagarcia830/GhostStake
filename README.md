# GhostStake

A privacy-preserving staking protocol built on FHEVM (Fully Homomorphic Encryption for the Ethereum Virtual Machine) that enables users to stake, manage, and withdraw encrypted digital assets without revealing their balances or transaction amounts to anyone, including blockchain observers and node operators.

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Custom Tasks](#custom-tasks)
- [Security Considerations](#security-considerations)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Overview

GhostStake is a next-generation staking protocol that leverages Fully Homomorphic Encryption (FHE) to provide complete on-chain privacy for staking operations. Unlike traditional staking protocols where all balances and transactions are publicly visible on the blockchain, GhostStake encrypts all sensitive data while still allowing computations to be performed on encrypted values.

This revolutionary approach enables users to:
- Stake assets without revealing their stake amounts
- Withdraw rewards without exposing their total holdings
- Maintain complete financial privacy while participating in on-chain DeFi activities
- Prove their operations are valid without revealing the underlying data

## The Problem

### Traditional Blockchain Transparency Issues

1. **Public Financial Data**: All balances and transactions on traditional blockchains are publicly visible, creating privacy concerns for individuals and organizations
2. **Front-Running Vulnerabilities**: Visible pending transactions allow malicious actors to front-run legitimate users
3. **Competitive Intelligence Leakage**: Large stakers and institutional players have their strategies exposed to competitors
4. **User Profiling**: Transaction history can be analyzed to profile users' financial behavior and net worth
5. **Regulatory Compliance Challenges**: Organizations need privacy for proprietary trading strategies while maintaining regulatory compliance

### Existing Privacy Solutions Fall Short

- **Layer 2 Solutions**: Often trade off security or decentralization for privacy
- **Mixing Services**: Create regulatory concerns and don't provide computational privacy
- **Zero-Knowledge Proofs**: Require trusted setups and don't support arbitrary computations on encrypted data
- **Traditional Encryption**: Cannot perform computations on encrypted data without decryption

## The Solution

GhostStake leverages **FHEVM** (Fully Homomorphic Encryption for EVM) from Zama to enable:

### On-Chain Confidential Computation
- All sensitive values (balances, stakes, transaction amounts) remain encrypted on-chain
- Smart contracts can perform arithmetic operations directly on encrypted data
- No trusted party ever sees plaintext values
- Only authorized users can decrypt their own data

### Programmable Privacy
- Developers can write Solidity smart contracts that operate on encrypted data
- Complex DeFi logic can be implemented while preserving privacy
- Composability with other privacy-preserving protocols

### True Decentralization
- No off-chain computation required
- No centralized mixer or relayer
- All operations verified on-chain with full consensus

## Key Features

### 1. Complete Balance Privacy
- User balances are stored as encrypted values (`euint32`)
- Only the owner can decrypt and view their balance
- Blockchain observers see only encrypted ciphertext
- Prevents wealth analysis and user profiling

### 2. Confidential Staking Operations
- Stake amounts are encrypted before being sent to the contract
- Staking transactions don't reveal the amount being staked
- Prevents competitive intelligence gathering
- Protects users from targeted attacks

### 3. Encrypted Status Codes
- Even operation success/failure status is encrypted
- Prevents information leakage through error messages
- Status codes include:
  - `0`: Operation successful
  - `1`: Insufficient balance for staking
  - `2`: Insufficient staked amount for withdrawal

### 4. Client-Side Encryption
- Input values are encrypted on the client side before transmission
- Uses FHEVM SDK for secure key generation and encryption
- Includes zero-knowledge proofs for input validation

### 5. Secure Permission System
- Fine-grained access control for encrypted data
- Contract and user permissions managed via `FHE.allow()`
- Prevents unauthorized decryption attempts

### 6. Fair Initial Distribution
- Each user can claim an initial grant of 100 Gold tokens once
- Claim status tracked publicly (transparency for fairness)
- Prevents multiple claims from same address

### 7. Atomic Operations
- All state changes are atomic and revert on failure
- Encrypted conditional logic ensures consistent state
- No partial updates or inconsistent balances

### 8. Gas-Optimized FHE Operations
- Efficient storage patterns with existence flags
- Minimizes redundant FHE operations
- Optimized for Solidity 0.8.27 with Cancun EVM features

## Technology Stack

### Smart Contract Layer
- **Solidity 0.8.27**: Latest Solidity with Cancun EVM optimizations
- **FHEVM Library (@fhevm/solidity ^0.8.0)**: Core FHE primitives and operations
- **OpenZeppelin Standards**: Industry-standard patterns and security

### Development Framework
- **Hardhat**: Ethereum development environment
- **TypeScript**: Type-safe development experience
- **Hardhat Deploy**: Deterministic deployment management
- **TypeChain**: Type-safe contract interactions

### Testing & Quality
- **Chai**: Assertion library for comprehensive tests
- **Hardhat Network**: Local FHEVM-compatible test environment
- **FHEVM Hardhat Plugin**: FHE-specific testing utilities
- **Solidity Coverage**: Test coverage analysis
- **Hardhat Gas Reporter**: Gas optimization tracking

### Encryption Technology
- **FHEVM (Zama)**: Fully Homomorphic Encryption for EVM
- **TFHE Scheme**: Torus Fully Homomorphic Encryption
- **Encrypted Types Library**: Type-safe encrypted data types
- **Zama FHE Relayer SDK**: Client-side encryption utilities

### Network Support
- **Local Development**: Hardhat Network with FHEVM support
- **Testnet**: Sepolia with Zama FHEVM infrastructure
- **Mainnet Ready**: Architecture supports production deployment

### Code Quality Tools
- **ESLint**: TypeScript and JavaScript linting
- **Solhint**: Solidity linting and best practices
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality gates

## How It Works

### Encryption Model

GhostStake uses **Torus Fully Homomorphic Encryption (TFHE)**, which supports operations on encrypted integers. Here's how it works:

1. **Encryption**: Values are encrypted client-side using FHEVM SDK
2. **Computation**: Smart contracts perform arithmetic on encrypted values
3. **Storage**: Encrypted values stored on-chain as ciphertexts
4. **Decryption**: Only authorized users can decrypt their data using private keys

### Operation Flow

#### 1. Claiming Initial Gold

```
User → claimInitialGold() → Contract
  ↓
Contract checks: hasClaimed[user] == false
  ↓
Create encrypted value: FHE.asEuint32(100)
  ↓
Add to balance: balance = balance + 100 (encrypted)
  ↓
Set permissions: FHE.allow(balance, user)
  ↓
Emit GoldClaimed event
```

#### 2. Staking Gold

```
User → Encrypt amount (50) → Get handle + proof
  ↓
User → stakeGold(handle, proof) → Contract
  ↓
Contract verifies proof: FHE.fromExternal()
  ↓
Check: balance >= amount (encrypted comparison)
  ↓
If sufficient:
  balance = balance - amount (encrypted arithmetic)
  stake = stake + amount (encrypted arithmetic)
  status = 0 (success)
Else:
  balance unchanged
  stake unchanged
  status = 1 (insufficient balance)
  ↓
Update storage (all encrypted)
  ↓
Emit GoldStaked event
```

#### 3. Withdrawing Staked Gold

```
User → Encrypt amount (20) → Get handle + proof
  ↓
User → withdrawStakedGold(handle, proof) → Contract
  ↓
Contract verifies proof: FHE.fromExternal()
  ↓
Check: stake >= amount (encrypted comparison)
  ↓
If sufficient:
  stake = stake - amount (encrypted arithmetic)
  balance = balance + amount (encrypted arithmetic)
  status = 0 (success)
Else:
  stake unchanged
  balance unchanged
  status = 2 (insufficient stake)
  ↓
Update storage (all encrypted)
  ↓
Emit GoldWithdrawn event
```

### Security Through FHE Select

GhostStake uses `FHE.select()` for conditional logic without branching:

```solidity
// Instead of:
if (balance >= amount) {
    balance = balance - amount;
    status = 0;
} else {
    status = 1;
}

// We use:
ebool sufficient = FHE.ge(balance, amount);
balance = FHE.select(sufficient, balance - amount, balance);
status = FHE.select(sufficient, 0, 1);
```

This ensures:
- No information leakage through control flow
- Constant-time execution (no timing attacks)
- Both branches computed but only correct result stored

## Architecture

### Contract Structure

```
GhostStake.sol
├── State Variables
│   ├── goldBalances: mapping(address => euint32)      # Encrypted wallet balances
│   ├── stakedBalances: mapping(address => euint32)    # Encrypted staked amounts
│   ├── lastActionStatus: mapping(address => euint32)  # Encrypted operation status
│   ├── hasClaimed: mapping(address => bool)           # Public claim tracking
│   ├── hasGoldBalance: mapping(address => bool)       # Existence flag optimization
│   ├── hasStakedBalance: mapping(address => bool)     # Existence flag optimization
│   └── hasStatusRecord: mapping(address => bool)      # Existence flag optimization
│
├── Public Functions
│   ├── claimInitialGold()                            # One-time Gold claim
│   ├── stakeGold(handle, proof)                      # Stake encrypted amount
│   ├── withdrawStakedGold(handle, proof)             # Withdraw encrypted amount
│   ├── getGoldBalance(address)                       # Returns encrypted balance
│   ├── getStakedBalance(address)                     # Returns encrypted stake
│   ├── getLastActionStatus(address)                  # Returns encrypted status
│   └── hasClaimedInitialGold(address)                # Returns public claim status
│
├── Private Functions
│   ├── _storeEncryptedValue(...)                     # Secure storage helper
│   └── _storeStatus(...)                             # Status update helper
│
└── Events
    ├── GoldClaimed(address indexed player)
    ├── GoldStaked(address indexed player)
    └── GoldWithdrawn(address indexed player)
```

### Storage Optimization Pattern

```solidity
// Efficient pattern for optional encrypted values
mapping(address => euint32) private goldBalances;
mapping(address => bool) private hasGoldBalance;

// When reading:
euint32 balance = hasGoldBalance[user]
    ? goldBalances[user]
    : FHE.asEuint32(0);

// When writing:
_storeEncryptedValue(goldBalances, hasGoldBalance, user, newValue);
```

Benefits:
- Avoids unnecessary FHE operations on zero values
- Reduces gas costs for first-time users
- Clear initialization semantics

### Permission Management

```solidity
function _storeEncryptedValue(...) private {
    storageBucket[player] = value;
    flags[player] = true;
    FHE.allowThis(value);     // Contract can read this value
    FHE.allow(value, player);  // Player can decrypt this value
}
```

This ensures:
- Contract retains access for future operations
- User can decrypt and view their own data
- No other parties can access the plaintext

## Installation

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher (or yarn/pnpm)
- **Git**: For cloning the repository

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/GhostStake.git
cd GhostStake
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- FHEVM libraries and Hardhat plugins
- TypeScript and TypeChain for type safety
- Testing frameworks and utilities
- Development tools and linters

### Step 3: Verify Installation

```bash
npm run compile
```

If successful, you should see:
```
Compiled 1 Solidity file successfully
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required for Sepolia deployment
PRIVATE_KEY=your_wallet_private_key_here

# Required for Sepolia RPC access
INFURA_API_KEY=your_infura_api_key_here

# Optional: For contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Optional: Enable gas reporting
REPORT_GAS=true
```

### Hardhat Variables (Alternative Method)

Instead of `.env`, you can use Hardhat's secure variable storage:

```bash
# Set your wallet mnemonic
npx hardhat vars set MNEMONIC

# Set Infura API key
npx hardhat vars set INFURA_API_KEY

# Set Etherscan API key (for verification)
npx hardhat vars set ETHERSCAN_API_KEY
```

### Network Configuration

The project supports multiple networks out of the box:

#### Local Development (Hardhat Network)
- Chain ID: 31337
- FHEVM Mock Mode: Enabled
- No configuration needed

#### Local Node (Anvil)
- Chain ID: 31337
- RPC: http://localhost:8545
- Requires PRIVATE_KEY in `.env`

#### Sepolia Testnet
- Chain ID: 11155111
- RPC: Infura endpoint
- Requires PRIVATE_KEY and INFURA_API_KEY
- Zama FHEVM Infrastructure: Enabled

## Usage

### Running Tests

#### Local Tests (FHEVM Mock)

```bash
npm run test
```

This runs the full test suite on Hardhat's local FHEVM mock, which simulates FHE operations for fast testing.

Expected output:
```
  GhostStake
    ✓ starts with zero balances (XXms)
    ✓ allows players to claim 100 Gold exactly once (XXms)
    ✓ stakes encrypted Gold and updates balances (XXms)
    ✓ rejects staking more Gold than available (XXms)
    ✓ withdraws staked Gold with encrypted amounts (XXms)
    ✓ blocks withdrawing more Gold than staked (XXms)

  6 passing (XXms)
```

#### Sepolia Testnet Tests

```bash
npm run test:sepolia
```

Tests on Sepolia using real FHEVM infrastructure (requires funded wallet).

### Local Development

#### Start Local Node

```bash
# Terminal 1: Start Hardhat node
npm run chain
```

#### Deploy to Local Network

```bash
# Terminal 2: Deploy contracts
npm run deploy:localhost
```

#### Interact Using Tasks

```bash
# Claim initial Gold
npx hardhat task:claim --network localhost

# Stake 50 Gold
npx hardhat task:stake --value 50 --network localhost

# Check balances (decrypted)
npx hardhat task:decrypt-balances --network localhost

# Withdraw 20 Gold from stake
npx hardhat task:withdraw --value 20 --network localhost

# Get contract address
npx hardhat task:address --network localhost
```

### Sepolia Testnet Deployment

#### Step 1: Get Testnet ETH

Get Sepolia ETH from a faucet:
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

#### Step 2: Deploy Contract

```bash
npm run deploy:sepolia
```

Output:
```
Deploying GhostStake...
GhostStake contract: 0x1234567890abcdef...
```

#### Step 3: Verify on Etherscan

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

#### Step 4: Interact with Deployed Contract

```bash
# Claim Gold on Sepolia
npx hardhat task:claim --network sepolia --address <CONTRACT_ADDRESS>

# Stake on Sepolia
npx hardhat task:stake --value 50 --network sepolia --address <CONTRACT_ADDRESS>

# Check balances on Sepolia
npx hardhat task:decrypt-balances --network sepolia --address <CONTRACT_ADDRESS>
```

### Code Quality

#### Run Linters

```bash
# Run all linting checks
npm run lint

# Run Solidity linting only
npm run lint:sol

# Run TypeScript linting only
npm run lint:ts
```

#### Format Code

```bash
# Check formatting
npm run prettier:check

# Auto-format all files
npm run prettier:write
```

#### Test Coverage

```bash
npm run coverage
```

Generates a coverage report in `./coverage/index.html`.

#### Clean Build

```bash
npm run clean
```

Removes all build artifacts and generated types.

## Testing

### Test Suite Overview

The test suite covers all core functionality with both positive and negative test cases:

1. **Initial State Tests** (`test/GhostStake.ts:52-58`)
   - Verifies zero balances for new users
   - Tests empty state initialization

2. **Claim Tests** (`test/GhostStake.ts:60-73`)
   - Successfully claims 100 Gold
   - Verifies encrypted balance after claim
   - Prevents duplicate claims from same address
   - Checks status code encryption

3. **Staking Tests** (`test/GhostStake.ts:75-96`)
   - Stakes encrypted amount successfully
   - Updates both balance and stake correctly
   - Verifies encrypted arithmetic operations

4. **Insufficient Balance Tests** (`test/GhostStake.ts:98-119`)
   - Attempts to stake more than available
   - Verifies balances remain unchanged
   - Checks encrypted error status (code 1)

5. **Withdrawal Tests** (`test/GhostStake.ts:121-147`)
   - Withdraws encrypted staked amount
   - Verifies balance restoration
   - Tests multiple sequential operations

6. **Insufficient Stake Tests** (`test/GhostStake.ts:149-175`)
   - Attempts to withdraw more than staked
   - Verifies state remains unchanged
   - Checks encrypted error status (code 2)

### Writing Custom Tests

Example test structure:

```typescript
import { ethers, fhevm } from "hardhat";
import { expect } from "chai";

describe("Custom Test", function () {
  it("should perform encrypted operation", async function () {
    // Deploy contract
    const factory = await ethers.getContractFactory("GhostStake");
    const contract = await factory.deploy();
    const contractAddress = await contract.getAddress();

    // Get signer
    const [alice] = await ethers.getSigners();

    // Claim initial Gold
    await contract.connect(alice).claimInitialGold();

    // Create encrypted input
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(30)  // Stake 30 Gold
      .encrypt();

    // Call function
    await contract.connect(alice).stakeGold(
      input.handles[0],
      input.inputProof
    );

    // Decrypt and verify
    const encBalance = await contract.getGoldBalance(alice.address);
    const balance = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encBalance,
      contractAddress,
      alice
    );

    expect(balance).to.equal(70);  // 100 - 30
  });
});
```

### Testing Best Practices

1. **Always Test in Mock Mode First**: FHEVM mock mode is faster and cheaper
2. **Test Edge Cases**: Zero amounts, maximum values, boundary conditions
3. **Verify Encrypted State**: Use decryption utilities to verify correctness
4. **Test Error Paths**: Ensure proper status codes for failures
5. **Multi-User Scenarios**: Test interactions between different users
6. **Gas Optimization**: Monitor gas usage with `REPORT_GAS=true`

## Deployment

### Deployment Process

The project uses `hardhat-deploy` for deterministic deployments:

1. **Deployment Script** (`deploy/deploy.ts:1-18`)
   - Gets deployer account from named accounts
   - Deploys GhostStake contract
   - Logs contract address
   - Saves deployment info to `deployments/` directory

2. **Deployment Command**:
```bash
# Local
npx hardhat deploy --network localhost

# Sepolia
npx hardhat deploy --network sepolia
```

3. **Verification**:
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Deployment Outputs

After deployment, you'll find:

```
deployments/
├── localhost/
│   └── GhostStake.json    # Local deployment info
└── sepolia/
    └── GhostStake.json    # Sepolia deployment info
```

Each JSON file contains:
- Contract address
- Deployment transaction hash
- ABI
- Bytecode
- Constructor arguments
- Network information

### Multi-Network Deployment Strategy

For production:

1. **Test on Local Network**
   ```bash
   npm run chain
   npm run deploy:localhost
   npm test
   ```

2. **Deploy to Testnet**
   ```bash
   npm run deploy:sepolia
   npm run test:sepolia
   ```

3. **Verify and Audit**
   ```bash
   npx hardhat verify --network sepolia <ADDRESS>
   # External audit
   ```

4. **Deploy to Mainnet** (when ready)
   ```bash
   # Add mainnet config to hardhat.config.ts
   npm run deploy:mainnet
   ```

### Post-Deployment Checklist

- [ ] Verify contract on block explorer
- [ ] Test all functions via tasks
- [ ] Check permissions and access control
- [ ] Document contract address
- [ ] Set up monitoring/alerting
- [ ] Create user documentation
- [ ] Perform security audit

## API Reference

### Public Functions

#### `claimInitialGold()`

Grants a one-time initial balance of 100 Gold to the caller.

```solidity
function claimInitialGold() external
```

**Requirements**:
- Caller must not have claimed before (`hasClaimed[msg.sender] == false`)

**Effects**:
- Adds 100 Gold to `goldBalances[msg.sender]` (encrypted)
- Sets `hasClaimed[msg.sender] = true`
- Sets `lastActionStatus[msg.sender] = 0` (success, encrypted)
- Grants permissions to caller and contract
- Emits `GoldClaimed(msg.sender)`

**Reverts**:
- "Gold already claimed" if caller has already claimed

**Example**:
```typescript
await contract.claimInitialGold();
```

---

#### `stakeGold(externalEuint32, bytes)`

Stakes an encrypted amount of Gold.

```solidity
function stakeGold(
    externalEuint32 encryptedAmountHandle,
    bytes calldata inputProof
) external
```

**Parameters**:
- `encryptedAmountHandle`: Encrypted amount handle from FHEVM SDK
- `inputProof`: Zero-knowledge proof of correct encryption

**Requirements**:
- Valid encryption proof
- Encrypted amount <= current balance (enforced via FHE.select)

**Effects** (if sufficient balance):
- Subtracts amount from `goldBalances[msg.sender]` (encrypted)
- Adds amount to `stakedBalances[msg.sender]` (encrypted)
- Sets `lastActionStatus[msg.sender] = 0` (success, encrypted)

**Effects** (if insufficient balance):
- Balances remain unchanged
- Sets `lastActionStatus[msg.sender] = 1` (error, encrypted)

**Events**:
- Emits `GoldStaked(msg.sender)` regardless of success

**Example**:
```typescript
const input = await fhevm
  .createEncryptedInput(contractAddress, userAddress)
  .add32(50)
  .encrypt();

await contract.stakeGold(input.handles[0], input.inputProof);
```

---

#### `withdrawStakedGold(externalEuint32, bytes)`

Withdraws an encrypted amount of staked Gold.

```solidity
function withdrawStakedGold(
    externalEuint32 encryptedAmountHandle,
    bytes calldata inputProof
) external
```

**Parameters**:
- `encryptedAmountHandle`: Encrypted amount handle from FHEVM SDK
- `inputProof`: Zero-knowledge proof of correct encryption

**Requirements**:
- Valid encryption proof
- Encrypted amount <= current stake (enforced via FHE.select)

**Effects** (if sufficient stake):
- Subtracts amount from `stakedBalances[msg.sender]` (encrypted)
- Adds amount to `goldBalances[msg.sender]` (encrypted)
- Sets `lastActionStatus[msg.sender] = 0` (success, encrypted)

**Effects** (if insufficient stake):
- Balances remain unchanged
- Sets `lastActionStatus[msg.sender] = 2` (error, encrypted)

**Events**:
- Emits `GoldWithdrawn(msg.sender)` regardless of success

**Example**:
```typescript
const input = await fhevm
  .createEncryptedInput(contractAddress, userAddress)
  .add32(20)
  .encrypt();

await contract.withdrawStakedGold(input.handles[0], input.inputProof);
```

---

#### `getGoldBalance(address)`

Returns the encrypted wallet balance for a player.

```solidity
function getGoldBalance(address player) external view returns (euint32)
```

**Parameters**:
- `player`: Address to query

**Returns**:
- `euint32`: Encrypted balance (ciphertext)
- Returns `ethers.ZeroHash` if player has no balance

**Note**: Result must be decrypted client-side using FHEVM SDK.

**Example**:
```typescript
const encryptedBalance = await contract.getGoldBalance(userAddress);
const balance = await fhevm.userDecryptEuint(
  FhevmType.euint32,
  encryptedBalance,
  contractAddress,
  signer
);
console.log(`Balance: ${balance}`);
```

---

#### `getStakedBalance(address)`

Returns the encrypted staked balance for a player.

```solidity
function getStakedBalance(address player) external view returns (euint32)
```

**Parameters**:
- `player`: Address to query

**Returns**:
- `euint32`: Encrypted staked amount (ciphertext)
- Returns `ethers.ZeroHash` if player has no stake

**Note**: Result must be decrypted client-side using FHEVM SDK.

**Example**:
```typescript
const encryptedStake = await contract.getStakedBalance(userAddress);
const stake = await fhevm.userDecryptEuint(
  FhevmType.euint32,
  encryptedStake,
  contractAddress,
  signer
);
console.log(`Staked: ${stake}`);
```

---

#### `getLastActionStatus(address)`

Returns the encrypted status code for the player's last action.

```solidity
function getLastActionStatus(address player) external view returns (euint32)
```

**Parameters**:
- `player`: Address to query

**Returns**:
- `euint32`: Encrypted status code
  - `0`: Operation successful
  - `1`: Insufficient balance (stake operation failed)
  - `2`: Insufficient stake (withdraw operation failed)
- Returns `ethers.ZeroHash` if no operations performed

**Note**: Result must be decrypted client-side using FHEVM SDK.

**Example**:
```typescript
const encryptedStatus = await contract.getLastActionStatus(userAddress);
const status = await fhevm.userDecryptEuint(
  FhevmType.euint32,
  encryptedStatus,
  contractAddress,
  signer
);
if (status === 0) {
  console.log("Success");
} else if (status === 1) {
  console.log("Insufficient balance");
} else if (status === 2) {
  console.log("Insufficient stake");
}
```

---

#### `hasClaimedInitialGold(address)`

Indicates if the player already claimed the initial Gold reward.

```solidity
function hasClaimedInitialGold(address player) external view returns (bool)
```

**Parameters**:
- `player`: Address to query

**Returns**:
- `bool`: `true` if player has claimed, `false` otherwise

**Note**: This is the only public (non-encrypted) state variable for fairness transparency.

**Example**:
```typescript
const hasClaimed = await contract.hasClaimedInitialGold(userAddress);
if (!hasClaimed) {
  await contract.claimInitialGold();
}
```

---

### Events

#### `GoldClaimed(address indexed player)`

Emitted when a player successfully claims their initial 100 Gold.

```solidity
event GoldClaimed(address indexed player)
```

---

#### `GoldStaked(address indexed player)`

Emitted when a player attempts to stake Gold (regardless of success).

```solidity
event GoldStaked(address indexed player)
```

**Note**: Check `lastActionStatus` to determine if operation succeeded.

---

#### `GoldWithdrawn(address indexed player)`

Emitted when a player attempts to withdraw staked Gold (regardless of success).

```solidity
event GoldWithdrawn(address indexed player)
```

**Note**: Check `lastActionStatus` to determine if operation succeeded.

---

### Constants

```solidity
uint32 private constant INITIAL_GRANT = 100;
uint32 private constant STATUS_OK = 0;
uint32 private constant STATUS_INSUFFICIENT_BALANCE = 1;
uint32 private constant STATUS_INSUFFICIENT_STAKE = 2;
```

## Custom Tasks

GhostStake includes Hardhat tasks for easy interaction with deployed contracts.

### `task:address`

Prints the deployed GhostStake contract address.

```bash
npx hardhat task:address --network <network>
```

**Example**:
```bash
npx hardhat task:address --network sepolia
# Output: GhostStake address is 0x1234...
```

---

### `task:claim`

Calls the `claimInitialGold()` function to claim 100 Gold.

```bash
npx hardhat task:claim [--address <CONTRACT_ADDRESS>] --network <network>
```

**Options**:
- `--address`: Optional contract address (uses deployment record if omitted)

**Example**:
```bash
npx hardhat task:claim --network localhost
# Output:
# Wait for tx:0xabc123...
# tx:0xabc123... status=1
```

---

### `task:stake`

Stakes an encrypted amount of Gold.

```bash
npx hardhat task:stake --value <AMOUNT> [--address <CONTRACT_ADDRESS>] --network <network>
```

**Required**:
- `--value`: Amount of Gold to stake (uint32)

**Options**:
- `--address`: Optional contract address

**Example**:
```bash
npx hardhat task:stake --value 50 --network localhost
# Output:
# GhostStake: 0x1234...
# Wait for tx:0xdef456...
# tx:0xdef456... status=1
```

---

### `task:withdraw`

Withdraws an encrypted amount of staked Gold.

```bash
npx hardhat task:withdraw --value <AMOUNT> [--address <CONTRACT_ADDRESS>] --network <network>
```

**Required**:
- `--value`: Amount of Gold to withdraw (uint32)

**Options**:
- `--address`: Optional contract address

**Example**:
```bash
npx hardhat task:withdraw --value 20 --network localhost
# Output:
# GhostStake: 0x1234...
# Wait for tx:0x789abc...
# tx:0x789abc... status=1
```

---

### `task:decrypt-balances`

Decrypts and displays wallet balance, staked balance, and last action status.

```bash
npx hardhat task:decrypt-balances [--address <CONTRACT_ADDRESS>] [--player <PLAYER_ADDRESS>] --network <network>
```

**Options**:
- `--address`: Optional contract address
- `--player`: Optional player address (uses first signer if omitted)

**Example**:
```bash
npx hardhat task:decrypt-balances --network localhost
# Output:
# GhostStake: 0x1234...
# Player    : 0x5678...
# Gold balance : 70
# Staked Gold  : 30
# Status code  : 0
```

---

### Task Workflows

#### Complete Workflow Example

```bash
# 1. Deploy
npx hardhat deploy --network localhost

# 2. Claim initial Gold
npx hardhat task:claim --network localhost

# 3. Check balance
npx hardhat task:decrypt-balances --network localhost
# Output: Gold balance: 100, Staked Gold: 0

# 4. Stake 60 Gold
npx hardhat task:stake --value 60 --network localhost

# 5. Verify stake
npx hardhat task:decrypt-balances --network localhost
# Output: Gold balance: 40, Staked Gold: 60

# 6. Withdraw 20 Gold
npx hardhat task:withdraw --value 20 --network localhost

# 7. Final check
npx hardhat task:decrypt-balances --network localhost
# Output: Gold balance: 60, Staked Gold: 40, Status: 0
```

## Security Considerations

### FHE-Specific Security

1. **Encrypted State Consistency**
   - All state transitions use `FHE.select()` for constant-time operations
   - Prevents information leakage through control flow
   - Ensures atomic updates to encrypted state

2. **Permission Management**
   - Strict access control via `FHE.allow()` and `FHE.allowThis()`
   - Only contract and owner can access encrypted values
   - Permissions set immediately after storage updates

3. **Input Validation**
   - All external encrypted inputs require zero-knowledge proofs
   - Proofs verified via `FHE.fromExternal()`
   - Invalid proofs cause transaction revert

4. **No Plaintext Leakage**
   - Status codes encrypted despite being error indicators
   - Event emissions don't include amounts or balances
   - Only public information is claim status for fairness

### Smart Contract Security

1. **Reentrancy Protection**
   - No external calls to untrusted contracts
   - State changes complete before events
   - Follows Checks-Effects-Interactions pattern

2. **Integer Overflow Protection**
   - Solidity 0.8.27 built-in overflow checks
   - FHE operations handle overflow in encrypted domain
   - Addition/subtraction safely bounded by euint32 range

3. **Access Control**
   - Only users can initiate operations on their own balances
   - No admin functions or privileged roles
   - Fully decentralized operation

4. **Atomic Operations**
   - All multi-step operations are atomic
   - Failed operations revert completely
   - No partial state updates possible

### Known Limitations

1. **euint32 Range**: Values limited to 0 to 2^32-1 (4,294,967,295)
2. **Gas Costs**: FHE operations more expensive than plaintext arithmetic
3. **Decryption Required**: Users must decrypt to view their balances
4. **Client-Side Encryption**: Requires FHEVM SDK integration in frontend

### Best Practices for Integration

1. **Always Verify Proofs**: Use official FHEVM SDK for encryption
2. **Secure Key Management**: Protect user private keys for decryption
3. **Error Handling**: Check encrypted status codes after operations
4. **Gas Estimation**: Account for higher gas costs in FHE operations
5. **Testing**: Thoroughly test all edge cases in mock mode

### Audit Status

This project is currently:
- [ ] Not audited
- [ ] Community reviewed
- [ ] Production ready

**IMPORTANT**: This is a demonstration project. Do NOT use in production without professional security audit.

## Future Roadmap

### Phase 1: Core Enhancements (Q2 2025)

#### Multi-Asset Support
- Extend to support multiple token types (Gold, Silver, Bronze)
- Encrypted asset conversions and swaps
- Cross-asset staking strategies

#### Reward Mechanisms
- Time-based staking rewards (encrypted APY)
- Encrypted reward distribution logic
- Compound staking functionality

#### Enhanced Permissions
- Delegate permissions for third-party management
- Temporary access grants
- Revocable permissions system

### Phase 2: DeFi Integration (Q3 2025)

#### Encrypted Lending
- Borrow against staked assets
- Encrypted collateral ratios
- Private liquidation mechanisms

#### Encrypted DEX Integration
- Privacy-preserving swaps
- Encrypted liquidity pools
- Hidden order books

#### Cross-Chain Privacy
- Bridge to other FHE-enabled chains
- Encrypted cross-chain transfers
- Multi-chain staking strategies

### Phase 3: Advanced Features (Q4 2025)

#### Encrypted Governance
- Private voting mechanisms
- Encrypted proposal submissions
- Confidential vote delegation

#### Portfolio Management
- Encrypted multi-asset portfolios
- Private rebalancing strategies
- Confidential risk metrics

#### Advanced Analytics
- Encrypted performance metrics
- Private portfolio analytics
- Confidential yield optimization

### Phase 4: Ecosystem Growth (2026)

#### Developer Tools
- Frontend SDK for easy integration
- React hooks for GhostStake
- UI component library

#### Mobile Support
- Mobile wallet integration
- iOS/Android SDKs
- Encrypted push notifications

#### Institutional Features
- Multi-signature encrypted accounts
- Compliance reporting tools
- Institutional-grade security

### Research Initiatives

1. **Optimizations**
   - Gas optimization for FHE operations
   - Batch operation support
   - State compression techniques

2. **New Primitives**
   - Encrypted floating-point arithmetic
   - Private smart contract calls
   - Confidential oracles

3. **Scalability**
   - Layer 2 FHE solutions
   - Rollup integration
   - State channel support

### Community Priorities

We're actively seeking community feedback on:
- Most desired features
- Use case priorities
- Integration requirements
- Performance bottlenecks

Join our discussions on:
- GitHub Issues
- Discord community
- Monthly roadmap calls

## Contributing

We welcome contributions from the community! GhostStake is an open-source project, and we appreciate:

- Bug reports and fixes
- Feature requests and implementations
- Documentation improvements
- Test coverage enhancements
- Gas optimizations
- Security audits

### How to Contribute

#### 1. Fork and Clone

```bash
git clone https://github.com/yourusername/GhostStake.git
cd GhostStake
```

#### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `test/` - Test improvements
- `refactor/` - Code refactoring

#### 3. Make Changes

- Follow existing code style
- Add tests for new features
- Update documentation
- Run linters: `npm run lint`
- Ensure tests pass: `npm test`

#### 4. Commit Changes

```bash
git add .
git commit -m "feat: add encrypted reward distribution"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Test changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

#### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear description of changes
- Related issue numbers
- Test results
- Screenshots (if UI changes)

### Development Guidelines

#### Code Style

- **Solidity**: Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- **TypeScript**: ESLint configuration provided
- **Comments**: Document complex FHE operations
- **Gas Optimization**: Consider gas costs for FHE operations

#### Testing Requirements

- All new features must have tests
- Maintain >90% code coverage
- Test both success and failure cases
- Include edge case tests

#### Documentation

- Update README for new features
- Add inline code comments for complex logic
- Update API reference for new functions
- Include usage examples

### Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers get started
- Share knowledge and expertise

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to community calls
- Considered for future roles

## License

This project is licensed under the **BSD-3-Clause-Clear License**.

### What This Means

You are free to:
- Use the software for any purpose
- Modify the source code
- Distribute copies
- Distribute modified versions

Under the following conditions:
- Include the original copyright notice
- Include the license text
- Include the disclaimer of warranties

### Patent Rights

The BSD-3-Clause-Clear license explicitly:
- Does NOT grant patent rights
- Keeps patent rights reserved
- Provides clarity on patent position

### Full License

See the [LICENSE](LICENSE) file for complete terms.

### Third-Party Licenses

This project uses:
- **FHEVM by Zama**: BSD-3-Clause-Clear
- **Hardhat**: MIT License
- **OpenZeppelin Contracts**: MIT License
- **Ethers.js**: MIT License

See each package's license for full details.

## Support

### Documentation

- **FHEVM Docs**: [https://docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)
- **Hardhat Docs**: [https://hardhat.org/docs](https://hardhat.org/docs)
- **Zama Setup Guide**: [https://docs.zama.ai/protocol/solidity-guides/getting-started/setup](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)

### Community

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/GhostStake/issues)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/yourusername/GhostStake/discussions)
- **Zama Discord**: [Join the Zama community](https://discord.gg/zama)
- **Twitter**: Follow [@ZamaFHE](https://twitter.com/zamafhe) for updates

### Getting Help

1. **Check Documentation**: Start with this README and official docs
2. **Search Issues**: Your question might already be answered
3. **Ask in Discussions**: Community Q&A for general questions
4. **Open an Issue**: For bugs or feature requests
5. **Join Discord**: Real-time help from the community

### Contact

For security issues, please email: security@yourproject.com (DO NOT open public issues for security vulnerabilities)

For partnership inquiries: partnerships@yourproject.com

---

**Built with privacy and security in mind, powered by Zama's FHEVM technology.**

**Star this repo if you find it useful!**
