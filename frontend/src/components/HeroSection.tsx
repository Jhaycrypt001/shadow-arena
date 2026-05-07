import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden pt-32 pb-24 z-20">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto flex flex-col items-center gap-6 w-full">
        
        {/* The Sleek "Framer" Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[13px] font-medium tracking-wide text-white/70 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          Fully On-Chain • FHE Powered
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          The Shadows Make <br /> Their Move.
        </h1>

        {/* Subtext */}
        <p className="text-base md:text-lg text-white/60 max-w-xl mt-2 leading-relaxed">
          Experience the first fully confidential Web3 chess engine. Fog of war meets smart contracts in a provably fair, zero-knowledge battleground.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
          <Button 
            onClick={() => navigate("/game")} 
            variant="hero" 
            className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto px-8 shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all"
          >
            Play Game
          </Button>
          
          {/* UPDATED: Read Docs Button opens an external link in a new tab */}
          <Button 
            onClick={() => window.open("https://github.com/Jhaycrypt001/shadow-arena", "_blank", "noopener,noreferrer")} 
            variant="heroSecondary" 
            className="w-full sm:w-auto border border-white/10 bg-transparent hover:bg-white/5 text-white px-8 transition-all"
          >
            Read Docs
          </Button>
          {/* Note: I've set it to your GitHub repo for now. If you make a GitBook later, 
              just swap the URL above to "https://your-gitbook-link.com" */}
        </div>
      </div>
    </section>
  );
}