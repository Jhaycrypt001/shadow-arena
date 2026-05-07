import { ChessBoard } from "@/components/ChessBoard";
import { useAccount } from 'wagmi';

export default function Game() {
  const { address, isConnected } = useAccount();

  return (
    <div className="min-h-[calc(100vh-80px)] pb-12 bg-[#050505] px-4 md:px-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-purple-900/10 blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col gap-6">
        
        {/* Player Identity Header */}
        <div className="w-full flex justify-end animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center gap-3 p-2 pr-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 animate-pulse shadow-[0_0_20px_rgba(147,51,234,0.4)]" />
              <div className="flex flex-col justify-center">
                <p className="text-white font-mono text-sm leading-tight">
                  {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : "Spectator Mode"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold">
                    FHE Protocol {isConnected ? 'Active' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>
        </div>

        {/* The Unified Arena (Contains the Board & the integrated Sidebar) */}
        <div className="w-full animate-in fade-in duration-1000 delay-150">
          <ChessBoard />
        </div>
        
      </div>
    </div>
  );
}