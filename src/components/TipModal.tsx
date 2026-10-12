import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Coins, X, Check } from 'lucide-react';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  videoId: string | null;
}

export const TipModal: React.FC<TipModalProps> = ({
  isOpen,
  onClose,
  creatorId,
  creatorName,
  videoId,
}) => {
  const { user, sendTip } = useApp();
  const [amount, setAmount] = useState<number>(10);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickAmounts = [5, 10, 25, 50, 100];

  const handleSendTip = () => {
    if (amount <= 0) {
      setError('Tip must be at least 1 Token');
      return;
    }
    if (user.tokens < amount) {
      setError(`Insufficient tokens. Your balance: ${user.tokens} RUP`);
      return;
    }

    const ok = sendTip(creatorId, creatorName, videoId, amount);
    if (ok) {
      setSuccess(true);
      setError(null);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1400);
    } else {
      setError('Transaction failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative text-white">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-3 text-white">
          <Coins className="w-5 h-5 text-white" />
          <h3 className="text-base font-extrabold text-white uppercase font-mono">Tip Creator</h3>
        </div>

        <p className="text-xs text-neutral-400 mb-4 font-mono">
          Send direct tokens to <span className="text-white font-semibold">@{creatorName}</span>.
        </p>

        {success ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-neutral-900 border border-neutral-700 rounded-xl flex items-center justify-center text-white mb-2 shadow-lg">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white font-mono">Tip Sent Successfully</p>
            <p className="text-xs text-neutral-400 font-mono tabular-nums mt-1">
              Transferred {amount} RUP to {creatorName}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(q)}
                  className={`py-2 text-xs font-mono tabular-nums rounded-lg border transition-all ${
                    amount === q
                      ? 'bg-white text-black font-extrabold border-white shadow-sm'
                      : 'bg-black border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  +{q}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                Custom Amount (RUP)
              </label>
              <input
                type="number"
                min="1"
                max={user.tokens}
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className="w-full bg-black border border-neutral-700 rounded-lg p-2.5 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-white"
              />
              <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-1.5 font-mono">
                <span>Available balance:</span>
                <span className="tabular-nums font-semibold text-white">{user.tokens} RUP</span>
              </div>
            </div>

            {error && (
              <div className="text-xs text-neutral-300 bg-neutral-900 p-2 rounded border border-neutral-700 mb-3 font-mono">{error}</div>
            )}

            <button
              onClick={handleSendTip}
              className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs rounded-lg transition-colors font-mono uppercase tracking-wider"
            >
              Confirm Tip of {amount} Tokens
            </button>
          </>
        )}
      </div>
    </div>
  );
};
