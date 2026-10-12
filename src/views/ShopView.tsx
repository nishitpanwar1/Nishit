import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DigitalProduct } from '../types';

export const ShopView: React.FC = () => {
  const { buyProduct, hasEntitlement, setCurrentView, user, products } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [unlockedItems, setUnlockedItems] = useState<Record<string, boolean>>({});

  const filterChips = [
    { id: 'all', label: 'All Assets' },
    { id: 'templates', label: 'Notion Systems' },
    { id: 'presets', label: 'Video LUTs & Presets' },
    { id: 'audio', label: 'Sound Kits & Audio' },
    { id: 'guides', label: 'Protocols & Guides' },
    { id: 'fitness', label: 'Training Rig' },
  ];

  // Map real products from AppContext (no fake demo items)
  const realVaultAssets = products.map((p) => ({
    id: p.id,
    title: p.title,
    typeBadge: p.format || 'Digital Asset',
    creator: `@${p.creatorName || user.username || 'creator'}`,
    creatorAvatar: p.creatorId === user.id ? user.avatar : p.creatorAvatar,
    rating: `${p.rating || 5.0} (${p.salesCount || 0})`,
    tokens: p.priceTokens,
    category: typeof p.category === 'string' ? p.category.toLowerCase() : 'templates',
    desc: p.description,
    image: p.coverUrl || p.thumbnailUrl || 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=80',
    fileSize: p.fileSize || '5.0 MB',
    rawProduct: p,
  }));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePurchase = (p: (typeof realVaultAssets)[0]) => {
    if (unlockedItems[p.id] || hasEntitlement(p.id)) {
      showToast('Downloading asset files...');
      return;
    }

    if (user.tokens < p.tokens) {
      showToast(`Need ${p.tokens} tokens to unlock. You have ${user.tokens} tokens.`);
      return;
    }

    const res = buyProduct(p.rawProduct);
    if (res.success) {
      setUnlockedItems((prev) => ({ ...prev, [p.id]: true }));
      showToast(`Asset unlocked! ${p.tokens} tokens transferred.`);
    } else {
      showToast(res.message);
    }
  };

  const filteredAssets = realVaultAssets.filter((item) => {
    if (selectedFilter !== 'all' && item.category !== selectedFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.creator.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-black text-white py-8 px-4 sm:px-6 lg:px-8 select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-mono font-semibold shadow-2xl border border-neutral-700 flex items-center gap-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                Peer-to-Peer Creator Economy
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase font-mono mt-1">
              Digital Vault
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-sans max-w-xl">
              Unlock verified systems, notion workspaces, video editing presets, and sound kits built by creators using RiseUp tokens.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentView('wallet')}
              className="px-4 py-2 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-xs font-mono font-bold border border-neutral-800 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              <span>Balance: {user.tokens.toLocaleString()} TK</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('sell-product')}
              className="px-4 py-2 bg-white hover:bg-neutral-200 text-black rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>+ List New Asset</span>
            </button>
          </div>
        </div>

        {/* Creator Vault Revenue Banner */}
        <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-black border border-neutral-800 flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[24px]">token</span>
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm text-white uppercase">
                Creator Payout Rate: 95%
              </h3>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Keep 95% of every token spent on your digital assets. Instant cryptographic settlement into your creator balance.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentView('sell-product')}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-mono font-bold text-xs border border-neutral-700 transition-colors cursor-pointer"
          >
            Start Selling Assets
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {filterChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedFilter(chip.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                  selectedFilter === chip.id
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-neutral-500 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets or creators..."
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full p-16 text-center bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3 shadow-lg">
              <span className="material-symbols-outlined text-[44px] text-neutral-600">
                inventory_2
              </span>
              <h3 className="font-mono font-bold text-base uppercase text-white">
                Digital Vault is Currently Empty
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto font-sans">
                No digital assets have been listed yet. Be the first creator to list a Notion system, LUT pack, training protocol, or sound kit!
              </p>
              <button
                type="button"
                onClick={() => setCurrentView('sell-product')}
                className="mt-3 px-5 py-2.5 bg-white text-black font-mono font-bold text-xs uppercase rounded-xl hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
              >
                + List First Digital Asset
              </button>
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const isUnlocked = unlockedItems[asset.id] || hasEntitlement(asset.id);
              return (
                <div
                  key={asset.id}
                  className="group bg-neutral-950 rounded-2xl border border-neutral-800 hover:border-neutral-600 transition-all overflow-hidden flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-4">
                    {/* Asset Preview Image */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <img
                        src={asset.image}
                        alt={asset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold uppercase text-white border border-neutral-700">
                        {asset.typeBadge}
                      </span>
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-neutral-300 border border-neutral-700">
                        {asset.fileSize}
                      </span>
                    </div>

                    {/* Asset Info */}
                    <div className="px-5 space-y-2">
                      <h3 className="font-mono font-bold text-sm text-white group-hover:text-neutral-200 transition-colors line-clamp-1">
                        {asset.title}
                      </h3>
                      <p className="text-xs text-neutral-400 font-sans line-clamp-2 leading-relaxed">
                        {asset.desc}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-xs font-mono text-neutral-500">
                        <span className="text-neutral-300 font-bold">{asset.creator}</span>
                        <span>⭐ {asset.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Price & Unlock CTA */}
                  <div className="p-5 pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-500 uppercase">
                        Price
                      </div>
                      <div className="text-base font-mono font-bold text-white">
                        {asset.tokens} TK
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePurchase(asset)}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm ${
                        isUnlocked
                          ? 'bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700'
                          : 'bg-white hover:bg-neutral-200 text-black active:scale-95'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isUnlocked ? 'download' : 'lock_open'}
                      </span>
                      <span>{isUnlocked ? 'Download' : `Unlock (${asset.tokens} TK)`}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
