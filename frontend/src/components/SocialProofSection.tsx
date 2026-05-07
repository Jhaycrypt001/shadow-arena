import { useEffect, useRef, useState } from "react";

// Replaced fake brands with actual Web3 tech stack
const TECH_STACK = ["Zama FHE", "Hardhat", "Viem", "Wagmi", "React", "Vercel"];
// Duplicate for seamless infinite scrolling loop
const LOOPED_TECH = [...TECH_STACK, ...TECH_STACK];

export function SocialProofSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(0);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const fadeDuration = 0.5; // seconds to fade in/out

    const updateFade = () => {
      if (!video) return;
      const { currentTime, duration } = video;
      
      if (duration) {
        if (currentTime < fadeDuration) {
          // Fade in
          setOpacity(currentTime / fadeDuration);
        } else if (duration - currentTime < fadeDuration) {
          // Fade out
          setOpacity((duration - currentTime) / fadeDuration);
        } else {
          // Fully visible
          setOpacity(1);
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateFade);
    };

    const handleEnded = () => {
      setOpacity(0);
      setTimeout(() => {
        if (video) {
          video.currentTime = 0;
          video.play().catch(e => console.log("Playback prevented:", e));
        }
      }, 100);
    };

    video.addEventListener('ended', handleEnded);
    video.play().catch(e => console.log("Autoplay prevented:", e));
    animationFrameRef.current = requestAnimationFrame(updateFade);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-[#050505] -mt-10">
      {/* Background Video Layer */}
      <video
        ref={videoRef}
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-100"
        style={{ opacity }}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4"
      />
      
      {/* Heavy Gradient Fades to dissolve the harsh video edges into the dark background */}
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-[#050505] to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none z-10" />

      {/* Content Layer */}
      <div className="relative z-20 flex flex-col items-center pt-16 pb-24 px-4 w-full">
        {/* Spacer to show video */}
        <div className="h-40 w-full" />

        {/* Marquee Container */}
        <div className="max-w-5xl w-full flex flex-col md:flex-row items-center gap-12 overflow-hidden border-t border-white/10 pt-8 mt-12">
          
          {/* Left Text - Updated for Web3 */}
          <p className="text-white/40 text-sm font-medium uppercase tracking-widest whitespace-nowrap shrink-0 text-center md:text-left">
            Powered by next-gen <br className="hidden md:block" /> Web3 infrastructure
          </p>

          {/* Marquee Track */}
          <div className="flex overflow-hidden relative w-full mask-image-edges">
            <div className="flex whitespace-nowrap animate-marquee w-max items-center">
              {LOOPED_TECH.map((tech, i) => (
                <div key={i} className="flex items-center gap-3 mx-8 shrink-0">
                  {/* Keeping your liquid-glass style, just updating the content */}
                  <div className="liquid-glass w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white/80 border border-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    {tech.charAt(0)}
                  </div>
                  <span className="text-base font-semibold text-white">
                    {tech}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}