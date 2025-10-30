// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title GhostStake
/// @notice Players can claim, stake, and withdraw encrypted Gold balances.
contract GhostStake is SepoliaConfig {
    uint32 private constant INITIAL_GRANT = 100;
    uint32 private constant STATUS_OK = 0;
    uint32 private constant STATUS_INSUFFICIENT_BALANCE = 1;
    uint32 private constant STATUS_INSUFFICIENT_STAKE = 2;

    mapping(address => euint32) private goldBalances;
    mapping(address => euint32) private stakedBalances;
    mapping(address => bool) private hasClaimed;
    mapping(address => euint32) private lastActionStatus;
    mapping(address => bool) private hasGoldBalance;
    mapping(address => bool) private hasStakedBalance;
    mapping(address => bool) private hasStatusRecord;

    event GoldClaimed(address indexed player);
    event GoldStaked(address indexed player);
    event GoldWithdrawn(address indexed player);

    /// @notice Grants an initial encrypted balance of 100 Gold to the caller.
    function claimInitialGold() external {
        address player = msg.sender;
        require(!hasClaimed[player], "Gold already claimed");

        euint32 grant = FHE.asEuint32(INITIAL_GRANT);
        euint32 currentBalance = hasGoldBalance[player] ? goldBalances[player] : FHE.asEuint32(0);
        euint32 updatedBalance = FHE.add(currentBalance, grant);

        _storeEncryptedValue(goldBalances, hasGoldBalance, player, updatedBalance);
        _storeStatus(player, STATUS_OK);
        hasClaimed[player] = true;

        emit GoldClaimed(player);
    }

    /// @notice Stakes an encrypted amount of Gold.
    /// @param encryptedAmountHandle Encrypted amount handle supplied by the player.
    /// @param inputProof Input proof produced by the relayer SDK.
    function stakeGold(externalEuint32 encryptedAmountHandle, bytes calldata inputProof) external {
        address player = msg.sender;

        euint32 encryptedAmount = FHE.fromExternal(encryptedAmountHandle, inputProof);

        euint32 currentBalance = hasGoldBalance[player] ? goldBalances[player] : FHE.asEuint32(0);
        euint32 currentStake = hasStakedBalance[player] ? stakedBalances[player] : FHE.asEuint32(0);

        euint32 updatedBalance = FHE.sub(currentBalance, encryptedAmount);
        euint32 updatedStake = FHE.add(currentStake, encryptedAmount);

        ebool hasSufficientBalance = FHE.ge(currentBalance, encryptedAmount);

        euint32 safeBalance = FHE.select(hasSufficientBalance, updatedBalance, currentBalance);
        euint32 safeStake = FHE.select(hasSufficientBalance, updatedStake, currentStake);
        euint32 status = FHE.select(
            hasSufficientBalance,
            FHE.asEuint32(STATUS_OK),
            FHE.asEuint32(STATUS_INSUFFICIENT_BALANCE)
        );

        _storeEncryptedValue(goldBalances, hasGoldBalance, player, safeBalance);
        _storeEncryptedValue(stakedBalances, hasStakedBalance, player, safeStake);
        _storeEncryptedValue(lastActionStatus, hasStatusRecord, player, status);

        emit GoldStaked(player);
    }

    /// @notice Withdraws an encrypted amount of staked Gold.
    /// @param encryptedAmountHandle Encrypted amount handle supplied by the player.
    /// @param inputProof Input proof produced by the relayer SDK.
    function withdrawStakedGold(externalEuint32 encryptedAmountHandle, bytes calldata inputProof) external {
        address player = msg.sender;

        euint32 encryptedAmount = FHE.fromExternal(encryptedAmountHandle, inputProof);

        euint32 currentStake = hasStakedBalance[player] ? stakedBalances[player] : FHE.asEuint32(0);
        euint32 currentBalance = hasGoldBalance[player] ? goldBalances[player] : FHE.asEuint32(0);

        euint32 updatedStake = FHE.sub(currentStake, encryptedAmount);
        euint32 updatedBalance = FHE.add(currentBalance, encryptedAmount);

        ebool hasStakeAvailable = FHE.ge(currentStake, encryptedAmount);

        euint32 safeStake = FHE.select(hasStakeAvailable, updatedStake, currentStake);
        euint32 safeBalance = FHE.select(hasStakeAvailable, updatedBalance, currentBalance);
        euint32 status = FHE.select(
            hasStakeAvailable,
            FHE.asEuint32(STATUS_OK),
            FHE.asEuint32(STATUS_INSUFFICIENT_STAKE)
        );

        _storeEncryptedValue(stakedBalances, hasStakedBalance, player, safeStake);
        _storeEncryptedValue(goldBalances, hasGoldBalance, player, safeBalance);
        _storeEncryptedValue(lastActionStatus, hasStatusRecord, player, status);

        emit GoldWithdrawn(player);
    }

    /// @notice Returns the encrypted wallet balance for a player.
    function getGoldBalance(address player) external view returns (euint32) {
        return goldBalances[player];
    }

    /// @notice Returns the encrypted staked balance for a player.
    function getStakedBalance(address player) external view returns (euint32) {
        return stakedBalances[player];
    }

    /// @notice Indicates if the player already claimed the initial Gold reward.
    function hasClaimedInitialGold(address player) external view returns (bool) {
        return hasClaimed[player];
    }

    /// @notice Returns the encrypted status code for the player's last action.
    function getLastActionStatus(address player) external view returns (euint32) {
        return lastActionStatus[player];
    }

    function _storeEncryptedValue(
        mapping(address => euint32) storage storageBucket,
        mapping(address => bool) storage flags,
        address player,
        euint32 value
    ) private {
        storageBucket[player] = value;
        flags[player] = true;
        FHE.allowThis(value);
        FHE.allow(value, player);
    }

    function _storeStatus(address player, uint32 code) private {
        _storeEncryptedValue(lastActionStatus, hasStatusRecord, player, FHE.asEuint32(code));
    }
}
