import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const SellProductView: React.FC = () => {
  const { user, createProduct, setCurrentView } = useApp();

  const [title, setTitle] = useState('Ultimate 5AM Habit & Routine OS');
  const [description, setDescription] = useState(
    'Complete Notion workspace for early morning wake-ups, habit lock-in, and unbroken 90-day streaks.'
  );
  const [category, setCategory] = useState('Templates');
  const [format, setFormat] = useState('Notion System');
  const [price, setPrice] = useState(250);
  const [fileSize, setFileSize] = useState('4.2 MB');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    createProduct({
      title: title.trim(),
      description: description.trim(),
      category: 'Focus',
      type: 'template',
      priceTokens: Number(price) || 250,
      priceUsd: Math.round((Number(price) || 250) * 0.1),
      thumbnailUrl:
        'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80',
      downloadUrl: 'https://riseup.video/download-asset',
    });

    showToast('Asset published to Digital Vault!');
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentView('shop');
    }, 1200);
  };

  const netEarnings = Math.round(price * 0.95 * 10) / 10;

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-black text-white py-8 px-4 sm:px-6 lg:px-8 select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-mono font-semibold shadow-2xl border border-neutral-700 flex items-center gap-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-800">
          <div>
            <button
              type="button"
              onClick={() => setCurrentView('shop')}
              className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1 mb-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Digital Vault</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase font-mono">
              List Asset in Digital Vault
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-sans">
              Sell Notion systems, video LUTs, audio packs, and training guides. Keep 95% of token payouts.
            </p>
          </div>
        </div>

        {/* Listing Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-5">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                Asset Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cinematic Monochrome LUT Pack"
                className="w-full bg-black border border-neutral-800 focus:border-white px-3 py-2.5 rounded-xl text-xs text-white placeholder-neutral-500 outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                Description & Inclusions
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail what is included in the package and instructions on how to use it..."
                className="w-full bg-black border border-neutral-800 focus:border-white p-3 rounded-xl text-xs text-white placeholder-neutral-500 outline-none resize-none transition-colors"
              />
            </div>

            {/* Category and Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black border border-neutral-800 focus:border-white px-3 py-2.5 rounded-xl text-xs text-white outline-none"
                >
                  <option value="Templates">Notion Workspace</option>
                  <option value="Presets">Video LUTs & Presets</option>
                  <option value="Audio">Sound Kit & Audio</option>
                  <option value="Guides">Guide & PDF</option>
                  <option value="Fitness">Fitness & Training</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                  Format / File Badge
                </label>
                <input
                  type="text"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  placeholder="e.g. .CUBE LUTs / Notion Link"
                  className="w-full bg-black border border-neutral-800 focus:border-white px-3 py-2.5 rounded-xl text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Price and Payout Math */}
            <div className="p-4 bg-black rounded-xl border border-neutral-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                    Token Price
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={10}
                      step={10}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-32 bg-neutral-950 border border-neutral-800 focus:border-white px-3 py-2 rounded-xl text-sm font-mono font-bold text-white outline-none"
                    />
                    <span className="text-xs font-mono text-neutral-400">Tokens</span>
                  </div>
                </div>

                <div className="text-right font-mono text-xs space-y-0.5">
                  <div className="text-neutral-400">You Receive (95%):</div>
                  <div className="text-white text-base font-bold">{netEarnings} TK / sale</div>
                  <div className="text-[10px] text-neutral-500">Platform fee: 5% flat</div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-white hover:bg-neutral-200 text-black rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">publish</span>
                <span>{isSubmitting ? 'Publishing...' : 'Publish to Digital Vault'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
