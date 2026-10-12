import React from 'react';
import { ShieldCheck, AlertTriangle, EyeOff, KeyRound } from 'lucide-react';

export const PolicyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      <div className="pb-4 border-b border-[#272727]">
        <h1 className="text-xl md:text-2xl font-bold text-white font-display flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-white" />
          <span>Trust, Safety & Architectural Principles</span>
        </h1>
        <p className="text-xs text-[#aaaaaa] mt-0.5">
          RiseUp’s product charter: privacy by default, signed media delivery, and an immutable 4-step enforcement ladder.
        </p>
      </div>

      {/* 4-Step Enforcement Ladder */}
      <div className="p-6 bg-[#181818] border border-[#272727] rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm font-display">
          <AlertTriangle className="w-4 h-4 text-[#ff0033]" />
          <span>The 4-Step Enforcement Ladder</span>
        </div>
        <p className="text-xs text-[#cccccc] leading-relaxed">
          Unlike opaque blackbox algorithms, RiseUp operates on an explicit, transparent enforcement ladder. All safety-critical reports undergo mandatory human moderation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 bg-[#121212] border border-[#272727] rounded-lg space-y-1">
            <span className="font-bold text-white font-mono">Step 1. Removal with Reason</span>
            <p className="text-[#aaaaaa] text-[11px]">
              Content removed with a specific written rationale explaining the exact violation of the build charter.
            </p>
          </div>

          <div className="p-3 bg-[#121212] border border-[#272727] rounded-lg space-y-1">
            <span className="font-bold text-white font-mono">Step 2. 14-Day Limitation</span>
            <p className="text-[#aaaaaa] text-[11px]">
              Distribution in organic discovery pools restricted for 14 days following repeat violations.
            </p>
          </div>

          <div className="p-3 bg-[#121212] border border-[#272727] rounded-lg space-y-1">
            <span className="font-bold text-white font-mono">Step 3. Monetization Suspension</span>
            <p className="text-[#aaaaaa] text-[11px]">
              Live broadcasting and token earning capabilities frozen during ongoing disciplinary review.
            </p>
          </div>

          <div className="p-3 bg-[#121212] border border-[#272727] rounded-lg space-y-1">
            <span className="font-bold text-[#ff0033] font-mono">Step 4. Account Closure</span>
            <p className="text-[#aaaaaa] text-[11px]">
              Permanent expulsion from the RiseUp network with remaining token balances settled per terms.
            </p>
          </div>
        </div>
      </div>

      {/* Media Security & Signed URLs */}
      <div className="p-6 bg-[#181818] border border-[#272727] rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm font-display">
          <KeyRound className="w-4 h-4 text-white" />
          <span>Private Storage & Signed Playback URLs</span>
        </div>
        <p className="text-xs text-[#cccccc] leading-relaxed">
          Master uploads and client-transcoded renditions (360p, 720p, 1080p) are kept in private object storage. No raw bucket URLs are exposed. Playback requires short-lived cryptographically signed tokens generated on demand after entitlement validation.
        </p>
      </div>

      {/* Privacy by Default */}
      <div className="p-6 bg-[#181818] border border-[#272727] rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm font-display">
          <EyeOff className="w-4 h-4 text-white" />
          <span>Privacy by Default & Zero Watch Data Sales</span>
        </div>
        <p className="text-xs text-[#cccccc] leading-relaxed">
          Your watch history is never sold to third-party ad brokers. Intent vectors and discipline metrics exist solely for your own focus mastery and personal feed curation.
        </p>
      </div>
    </div>
  );
};
