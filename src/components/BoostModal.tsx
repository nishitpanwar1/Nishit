import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Rocket, X, Check } from 'lucide-react';

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
}

export const BoostModal: React.FC<BoostModalProps> = ({
  isOpen,
  onClose,
  videoId,
  videoTitle,
}) => {
  const { user, boostVideo } = useApp();
  const [tokens, setTokens] = useState<number>(20);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const boostOptions = [
    { amount: 10, impressions: '+2,500 targeted builder trials', days: '24h' },
    { amount: 20, impressions: '+6,000 priority lane placements', days: '48h' },
    { amount: 50, impressions: '+18,000 network-wide discovery push', days: '7d' },
  ];

  const handleBoost = () => {
    if (user.tokens < tokens) {
      setError(`Insufficient tokens. Available: ${user.tokens} RUP`);
      return;
    }

    const ok = boostVideo(videoId, tokens);
    if (ok) {
      setSuccess(true);
      setError(null);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1400);
    } else {
      setError('Boost could not be processed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1f1f1f] border border-[#303030] rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#aaaaaa] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-white">
          <Rocket className="w-5 h-5 text-white" />
          <h3 className="text-base font-bold text-white font-display">Boost Video Distribution</h3>
        </div>

        <p className="text-xs text-[#aaaaaa] mb-4 line-clamp-2">
          Allocate platform tokens to amplify distribution for: <span className="text-white font-medium">"{videoTitle}"</span>.
          Boosts undergo organic retention checks and never bypass safety rules.
        </p>

        {success ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white mb-2">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">Boost Active!</p>
            <p className="text-xs text-[#aaaaaa] font-mono tabular-nums">
              Applied {tokens} RUP to recommendation velocity.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {boostOptions.map((opt) => (
                <div
                  key={opt.amount}
                  onClick={() => setTokens(opt.amount)}
                  className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                    tokens === opt.amount
                      ? 'bg-white text-black border-white'
                      : 'bg-[#121212] border-[#272727] text-[#cccccc] hover:border-[#383838]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{opt.impressions}</div>
                    <div className={`text-[11px] ${tokens === opt.amount ? 'text-neutral-700' : 'text-[#717171]'}`}>Duration: {opt.days} window</div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono tabular-nums text-sm font-bold ${tokens === opt.amount ? 'text-black' : 'text-white'}`}>
                      {opt.amount} RUP
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs text-[#aaaaaa] mb-4 font-mono">
              <span>Your available balance:</span>
              <span className="font-bold text-white tabular-nums">{user.tokens} RUP</span>
            </div>

            {error && (
              <div className="text-xs text-[#ff0033] mb-3 font-mono">{error}</div>
            )}

            <button
              onClick={handleBoost}
              className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-full transition-colors shadow-sm"
            >
              Allocate {tokens} Tokens
            </button>
          </>
        )}
      </div>
    </div>
  );
};
