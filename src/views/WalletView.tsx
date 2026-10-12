import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const WalletView: React.FC = () => {
  const { user, ledger, lockTokensInVault, setCurrentView, openUploadModal } = useApp();

  const [lockAmount, setLockAmount] = useState<number>(500);
  const [lockDuration, setLockDuration] = useState<number>(90);
  const [lockToast, setLockToast] = useState<string | null>(null);

  const handleLockTokens = async () => {
    if (user.tokens < lockAmount) {
      setLockToast('Insufficient tokens to commit to vault.');
      setTimeout(() => setLockToast(null), 3500);
      return;
    }
    const res = await lockTokensInVault(lockAmount, lockDuration);
    setLockToast(res.message);
    setTimeout(() => setLockToast(null), 3500);
  };

  const handleMaxAmount = () => {
    setLockAmount(user.tokens);
  };

  const totalEarned = ledger
    .filter((e) => e.delta > 0)
    .reduce((sum, e) => sum + e.delta, 0);

  const totalSpent = Math.abs(
    ledger.filter((e) => e.delta < 0).reduce((sum, e) => sum + e.delta, 0)
  );

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-black text-white py-8 px-4 sm:px-6 lg:px-8 select-none">
      {/* Toast */}
      {lockToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-mono font-semibold shadow-2xl border border-neutral-700 flex items-center gap-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{lockToast}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                Cryptographic Token Ledger
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase font-mono mt-1">
              Token Wallet
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-sans max-w-xl">
              Earn tokens by uploading and watching. Spend them to tip creators or unlock Digital Vault assets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentView('arena')}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-mono font-bold uppercase border border-neutral-800 transition-colors"
            >
              Leaderboard
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 uppercase">
              <span>Available Balance</span>
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
            <div className="text-3xl font-mono font-bold text-white">
              {user.tokens.toLocaleString()} TK
            </div>
            <span className="text-[10px] text-neutral-500 font-mono block">
              Verified & Liquid Balance
            </span>
          </div>

          <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 uppercase">
              <span>Total Earned</span>
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
            </div>
            <div className="text-3xl font-mono font-bold text-white">
              {totalEarned.toLocaleString()} TK
            </div>
            <span className="text-[10px] text-neutral-500 font-mono block">
              All-Time Token Inflow
            </span>
          </div>

          <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 uppercase">
              <span>Total Spent</span>
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
            <div className="text-3xl font-mono font-bold text-white">
              {totalSpent.toLocaleString()} TK
            </div>
            <span className="text-[10px] text-neutral-500 font-mono block">
              Tips & Vault Unlocks
            </span>
          </div>
        </div>

        {/* Vault Lock & Ledger Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Vault Lock Form (7 cols) */}
          <div className="lg:col-span-7 p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-5 shadow-lg">
            <div className="pb-3 border-b border-neutral-800">
              <h3 className="font-mono font-bold text-sm uppercase text-white">
                Lock Tokens In Vault (Yield Booster)
              </h3>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Commit tokens to build long-term discipline streaks and unlock higher creator payouts.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                  Commitment Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={50}
                    max={user.tokens}
                    value={lockAmount}
                    onChange={(e) => setLockAmount(Number(e.target.value))}
                    className="w-full bg-black border border-neutral-800 focus:border-white px-3 py-2.5 rounded-xl text-sm font-mono font-bold text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="absolute right-2 top-2 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-mono font-bold uppercase"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                  Lock Duration
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { days: 30, apy: '1.25x' },
                    { days: 90, apy: '1.50x' },
                    { days: 180, apy: '2.00x' },
                  ].map((tier) => (
                    <button
                      key={tier.days}
                      type="button"
                      onClick={() => setLockDuration(tier.days)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        lockDuration === tier.days
                          ? 'bg-white text-black border-white'
                          : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      <div className="font-mono font-bold text-xs uppercase">{tier.days} Days</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{tier.apy} Multiplier</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLockTokens}
                className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md active:scale-95 cursor-pointer"
              >
                Commit {lockAmount} Tokens to Vault
              </button>
            </div>
          </div>

          {/* Right Column: Ledger Activity (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4 shadow-lg">
            <div className="pb-3 border-b border-neutral-800">
              <h3 className="font-mono font-bold text-sm uppercase text-white">
                Recent Transactions
              </h3>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Audit trail of token earnings and payouts.
              </p>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto no-scrollbar font-mono text-xs">
              {ledger.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">No transactions recorded yet.</div>
              ) : (
                ledger.slice(0, 8).map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 bg-black rounded-xl border border-neutral-800/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{entry.description}</div>
                      <div className="text-[10px] text-neutral-500">{entry.createdAt}</div>
                    </div>
                    <span
                      className={`font-bold ${
                        entry.delta >= 0 ? 'text-white' : 'text-neutral-400'
                      }`}
                    >
                      {entry.delta >= 0 ? `+${entry.delta}` : entry.delta} TK
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
