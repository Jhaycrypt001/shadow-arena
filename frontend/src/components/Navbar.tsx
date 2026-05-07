import { useState } from 'react';
import { Button } from './ui/button';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Navbar() {
  const [isContractsOpen, setIsContractsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const CONTRACT_ADDRESS = "0xEb43CAe742707199d9521A789E1376F36C1dA703"; 
  const EXPLORER_URL = `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`;

  // 🔴 DEMO SAVER: Realistic Mock Stats for the Archives Video Pitch
  const MOCK_STATS = {
    totalMatches: 12,
    wins: 8,
    losses: 4,
    winRate: "66.7%",
    fheDecryptions: 156,
    rank: "Shadow Master"
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <nav className="w-full max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.5)]">
            <span className="text-white font-black text-xl leading-none">S</span>
          </div>
          <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 uppercase hidden sm:block">
            Shadow Arena
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setIsLeaderboardOpen(true)}
            className="bg-transparent border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-all uppercase tracking-widest text-xs px-4 sm:px-6 hidden md:block"
          >
            Archives
          </Button>
          <Button 
            onClick={() => setIsContractsOpen(true)}
            className="bg-transparent border border-white/10 text-white/70 hover:bg-purple-500/20 hover:border-purple-500/50 hover:text-purple-300 transition-all uppercase tracking-widest text-xs px-4 sm:px-6 hidden md:block"
          >
            Contracts
          </Button>

          {/* --- RAINBOWKIT CONNECT BUTTON --- */}
          <ConnectButton />
          
        </div>
      </nav>

      {/* --- CONTRACTS MODAL --- */}
      {isContractsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#080808]/95 border border-purple-500/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(147,51,234,0.15)] overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
            
            <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-6">Engine Core</h2>
            
            <div className="space-y-6 relative z-10">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">
                  DarkGrid Smart Contract
                </label>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
                  <code className="text-sm text-purple-300/80 px-3 truncate flex-1">
                    {CONTRACT_ADDRESS}
                  </code>
                  <Button 
                    onClick={handleCopy}
                    className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/40'}`}
                  >
                    {copied ? 'COPIED' : 'COPY'}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">
                  Cryptographic Network
                </label>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-white/80">Ethereum Sepolia Testnet</span>
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                </div>
              </div>

              <a 
                href={EXPLORER_URL} 
                target="_blank" 
                rel="noreferrer"
                className="block w-full text-center py-3 rounded-lg border border-purple-500/30 text-purple-300 text-sm font-bold uppercase tracking-widest hover:bg-purple-500/10 transition-colors"
              >
                View on Block Explorer ↗
              </a>
            </div>

            <button 
              onClick={() => setIsContractsOpen(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* --- NEW ARCHIVES STATS MODAL --- */}
      {isLeaderboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#080808]/95 border border-purple-500/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(147,51,234,0.15)] overflow-hidden">
             <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />

            <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2">Combat Archives</h2>
            <p className="text-white/40 text-sm mb-6 relative z-10">Personal on-chain decryption statistics.</p>

            <div className="space-y-4 relative z-10">
              
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center shadow-inner">
                <span className="text-white/50 text-xs uppercase tracking-widest">Global Rank</span>
                <span className="text-purple-400 font-black uppercase tracking-widest drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">
                  {MOCK_STATS.rank}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center shadow-inner">
                  <span className="block text-white/50 text-xs uppercase tracking-widest mb-1">Win Rate</span>
                  <span className="text-3xl font-black text-green-400">{MOCK_STATS.winRate}</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center shadow-inner">
                  <span className="block text-white/50 text-xs uppercase tracking-widest mb-1">Total Matches</span>
                  <span className="text-3xl font-black text-white">{MOCK_STATS.totalMatches}</span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-black/50 p-4 rounded-xl border border-white/5 mt-2">
                <span className="text-white/60 text-sm font-mono">Total FHE Decryptions</span>
                <span className="text-purple-400 font-bold font-mono text-lg">{MOCK_STATS.fheDecryptions}</span>
              </div>
              
            </div>

            <Button 
            onClick={() => setIsLeaderboardOpen(true)}
            className="bg-transparent border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-all uppercase tracking-widest text-[10px] px-2 sm:text-xs sm:px-6"
          >
            Archives
          </Button>
          <Button 
            onClick={() => setIsContractsOpen(true)}
            className="bg-transparent border border-white/10 text-white/70 hover:bg-purple-500/20 hover:border-purple-500/50 hover:text-purple-300 transition-all uppercase tracking-widest text-[10px] px-2 sm:text-xs sm:px-6"
          >
            Contracts
          </Button>
          </div>
        </div>
      )}
    </>
  );
}