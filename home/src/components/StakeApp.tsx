import { useState, useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Contract } from 'ethers';
import { Header } from './Header';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import '../styles/StakeApp.css';

const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

const STATUS_MESSAGES: Record<number, string> = {
  0: 'Ready for the next move',
  1: 'Insufficient Gold balance',
  2: 'Insufficient staked balance',
};

type Feedback = {
  type: 'success' | 'error' | 'info';
  text: string;
};

type DecryptedBalances = {
  gold: number;
  staked: number;
  status: number;
};

export function StakeApp() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: zamaLoading, error: zamaError } = useZamaInstance();

  const {
    data: goldCipher,
    refetch: refetchGold,
    isLoading: loadingGold,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getGoldBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const {
    data: stakedCipher,
    refetch: refetchStaked,
    isLoading: loadingStaked,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getStakedBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const {
    data: statusCipher,
    refetch: refetchStatus,
    isLoading: loadingStatus,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getLastActionStatus',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const {
    data: hasClaimed,
    refetch: refetchClaimStatus,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasClaimedInitialGold',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const [formValues, setFormValues] = useState({ stake: '', withdraw: '' });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decrypted, setDecrypted] = useState<DecryptedBalances | null>(null);

  const isLoadingBalances = loadingGold || loadingStaked || loadingStatus;

  const statusDescription = useMemo(() => {
    if (!decrypted) {
      return 'Decrypt to view the latest status';
    }

    return STATUS_MESSAGES[decrypted.status] ?? 'Unknown status';
  }, [decrypted]);

  const resetFeedback = () => setFeedback(null);

  const refreshAll = async () => {
    await Promise.allSettled([refetchGold(), refetchStaked(), refetchStatus(), refetchClaimStatus()]);
  };

  const ensureSigner = async () => {
    const signer = await signerPromise;
    if (!signer) {
      throw new Error('Wallet signer unavailable');
    }
    return signer;
  };

  const handleClaim = async () => {
    if (!address) {
      setFeedback({ type: 'error', text: 'Connect your wallet first' });
      return;
    }

    try {
      resetFeedback();
      setIsProcessing(true);
      const signer = await ensureSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setFeedback({ type: 'info', text: 'Claiming encrypted Gold...' });
      const tx = await contract.claimInitialGold();
      await tx.wait();

      setFeedback({ type: 'success', text: 'Initial Gold claimed successfully' });
      setDecrypted(null);
      await refreshAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Claim failed';
      setFeedback({ type: 'error', text: message });
    } finally {
      setIsProcessing(false);
    }
  };

  const processEncryptedAction = async (amount: number, mode: 'stake' | 'withdraw') => {
    if (!address) {
      throw new Error('Connect your wallet first');
    }

    if (!instance) {
      throw new Error('Zama encryption service unavailable');
    }

    if (Number.isNaN(amount) || amount <= 0 || amount > Number.MAX_SAFE_INTEGER) {
      throw new Error('Enter a positive amount');
    }

    const signer = await ensureSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
    input.add32(amount);

    const ciphertext = await input.encrypt();

    if (mode === 'stake') {
      const tx = await contract.stakeGold(ciphertext.handles[0], ciphertext.inputProof);
      await tx.wait();
      return;
    }

    const tx = await contract.withdrawStakedGold(ciphertext.handles[0], ciphertext.inputProof);
    await tx.wait();
  };

  const handleStake = async () => {
    const amount = Number(formValues.stake);
    try {
      resetFeedback();
      setIsProcessing(true);
      setFeedback({ type: 'info', text: 'Encrypting stake amount...' });
      await processEncryptedAction(amount, 'stake');
      setFeedback({ type: 'success', text: 'Stake transaction confirmed' });
      setFormValues(prev => ({ ...prev, stake: '' }));
      setDecrypted(null);
      await refreshAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Stake failed';
      setFeedback({ type: 'error', text: message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(formValues.withdraw);
    try {
      resetFeedback();
      setIsProcessing(true);
      setFeedback({ type: 'info', text: 'Encrypting withdrawal amount...' });
      await processEncryptedAction(amount, 'withdraw');
      setFeedback({ type: 'success', text: 'Withdrawal transaction confirmed' });
      setFormValues(prev => ({ ...prev, withdraw: '' }));
      setDecrypted(null);
      await refreshAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Withdrawal failed';
      setFeedback({ type: 'error', text: message });
    } finally {
      setIsProcessing(false);
    }
  };

  const decryptBalances = async () => {
    if (!instance) {
      setFeedback({ type: 'error', text: 'Zama encryption service unavailable' });
      return;
    }

    if (!address) {
      setFeedback({ type: 'error', text: 'Connect your wallet to decrypt' });
      return;
    }

    if (!goldCipher && !stakedCipher && !statusCipher) {
      setFeedback({ type: 'error', text: 'No balances to decrypt yet' });
      return;
    }

    try {
      resetFeedback();
      setIsDecrypting(true);

      const handles = [];
      if (goldCipher && goldCipher !== ZERO_HASH) {
        handles.push({ handle: goldCipher as string, contractAddress: CONTRACT_ADDRESS });
      }
      if (stakedCipher && stakedCipher !== ZERO_HASH) {
        handles.push({ handle: stakedCipher as string, contractAddress: CONTRACT_ADDRESS });
      }
      if (statusCipher && statusCipher !== ZERO_HASH) {
        handles.push({ handle: statusCipher as string, contractAddress: CONTRACT_ADDRESS });
      }

      if (handles.length === 0) {
        setDecrypted({
          gold: 0,
          staked: 0,
          status: 0,
        });
        setFeedback({ type: 'info', text: 'Balances are zero' });
        return;
      }

      const keypair = instance.generateKeypair();
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '7';
      const contractAddresses = [CONTRACT_ADDRESS];

      const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, timestamp, durationDays);
      const signer = await ensureSigner();

      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );

      const result = await instance.userDecrypt(
        handles,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        timestamp,
        durationDays,
      );

      const parsed: DecryptedBalances = {
        gold: goldCipher && goldCipher !== ZERO_HASH ? Number(result[goldCipher as string] || 0) : 0,
        staked: stakedCipher && stakedCipher !== ZERO_HASH ? Number(result[stakedCipher as string] || 0) : 0,
        status: statusCipher && statusCipher !== ZERO_HASH ? Number(result[statusCipher as string] || 0) : 0,
      };

      setDecrypted(parsed);
      setFeedback({ type: 'success', text: 'Decrypted balances available below' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Decryption failed';
      setFeedback({ type: 'error', text: message });
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="stake-app">
      <Header />
      <main className="stake-main">
        <section className="stake-grid">
          <div className="stake-card">
            <h2 className="stake-card-title">Encrypted Gold Overview</h2>
            {!address ? (
              <p className="stake-hint">Connect your wallet to view balances.</p>
            ) : (
              <>
                <div className="stake-balance-grid">
                  <div className="stake-balance-item">
                    <span className="stake-balance-label">Encrypted wallet balance</span>
                    <span className="stake-balance-handle">
                      {goldCipher && typeof goldCipher === 'string' ? `${(goldCipher as string).slice(0, 12)}…` : '—'}
                    </span>
                  </div>
                  <div className="stake-balance-item">
                    <span className="stake-balance-label">Encrypted staked balance</span>
                    <span className="stake-balance-handle">
                      {stakedCipher && typeof stakedCipher === 'string'
                        ? `${(stakedCipher as string).slice(0, 12)}…`
                        : '—'}
                    </span>
                  </div>
                  <div className="stake-balance-item">
                    <span className="stake-balance-label">Encrypted status code</span>
                    <span className="stake-balance-handle">
                      {statusCipher && typeof statusCipher === 'string'
                        ? `${(statusCipher as string).slice(0, 12)}…`
                        : '—'}
                    </span>
                  </div>
                </div>

                <div className="stake-decrypted-section">
                  <button
                    onClick={decryptBalances}
                    className="stake-action-button"
                    disabled={isDecrypting || zamaLoading || isLoadingBalances || !address}
                  >
                    {isDecrypting ? 'Decrypting...' : 'Decrypt balances'}
                  </button>

                  {decrypted && (
                    <div className="stake-decrypted-grid">
                      <div className="stake-decrypted-item">
                        <span className="stake-decrypted-label">Wallet Gold</span>
                        <span className="stake-decrypted-value">{decrypted.gold}</span>
                      </div>
                      <div className="stake-decrypted-item">
                        <span className="stake-decrypted-label">Staked Gold</span>
                        <span className="stake-decrypted-value">{decrypted.staked}</span>
                      </div>
                      <div className="stake-decrypted-item">
                        <span className="stake-decrypted-label">Status</span>
                        <span className="stake-decrypted-value">{statusDescription}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="stake-card">
            <h2 className="stake-card-title">Actions</h2>
            {feedback && <p className={`stake-feedback stake-feedback-${feedback.type}`}>{feedback.text}</p>}
            {zamaError && <p className="stake-feedback stake-feedback-error">{zamaError}</p>}

            <div className="stake-actions">
              <button
                onClick={handleClaim}
                className="stake-action-button"
                disabled={
                  isProcessing ||
                  zamaLoading ||
                  !address ||
                  isLoadingBalances ||
                  (hasClaimed !== undefined && hasClaimed === true)
                }
              >
                {!address
                  ? 'Connect wallet'
                  : hasClaimed
                    ? 'Gold already claimed'
                    : isProcessing
                      ? 'Processing...'
                      : 'Claim 100 Gold'}
              </button>

              <div className="stake-form">
                <label className="stake-form-label">Stake Gold</label>
                <div className="stake-form-row">
                  <input
                    type="number"
                    min="1"
                    value={formValues.stake}
                    onChange={(event) =>
                      setFormValues((prev) => ({ ...prev, stake: event.target.value.slice(0, 10) }))
                    }
                    className="stake-input"
                    placeholder="Enter amount"
                    disabled={isProcessing || zamaLoading || !address}
                  />
                  <button
                    onClick={handleStake}
                    className="stake-secondary-button"
                    disabled={isProcessing || zamaLoading || !address}
                  >
                    Stake
                  </button>
                </div>
              </div>

              <div className="stake-form">
                <label className="stake-form-label">Withdraw staked Gold</label>
                <div className="stake-form-row">
                  <input
                    type="number"
                    min="1"
                    value={formValues.withdraw}
                    onChange={(event) =>
                      setFormValues((prev) => ({ ...prev, withdraw: event.target.value.slice(0, 10) }))
                    }
                    className="stake-input"
                    placeholder="Enter amount"
                    disabled={isProcessing || zamaLoading || !address}
                  />
                  <button
                    onClick={handleWithdraw}
                    className="stake-secondary-button"
                    disabled={isProcessing || zamaLoading || !address}
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>

            <div className="stake-notes">
              <p>• Claim once to receive an encrypted balance of 100 Gold.</p>
              <p>• All amounts are encrypted before reaching the blockchain.</p>
              <p>• Status codes help identify insufficient balance or stake attempts.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
