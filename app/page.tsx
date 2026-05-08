"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);

  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(() => router.push("/dashboard"), 900);
  };

  return (
    <div
      className={`fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden transition-all duration-[900ms] ease-[cubic-bezier(0.4,0,0,1)] ${
        launching ? "scale-[2.5] opacity-0" : "scale-100 opacity-100"
      }`}
    >
      {/* Background video */}
      <div className="absolute inset-0">
        <video
          src="/deimos-bg.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60"
          ref={(el) => { if (el) el.playbackRate = 0.65; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-2">
          <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
            <defs>
              <radialGradient id="glow" cx="72%" cy="22%" r="45%">
                <stop offset="0%" stopColor="#FF8A1F" stopOpacity="1" />
                <stop offset="55%" stopColor="#FF8A1F" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FF8A1F" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="14" cy="14" r="12.5" stroke="rgba(255,138,31,0.3)" strokeWidth="0.7" />
            <circle cx="14" cy="14" r="11" fill="rgba(0,0,0,0.55)" />
            <path
              d="M19.5 4.2 C24 6.8 26.5 11 26 15.5 C25.5 20 22.5 23.5 18.5 25"
              stroke="url(#glow)"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="19.8" cy="4.5" r="1.4" fill="#FF8A1F" opacity="0.9" />
            <circle cx="19.8" cy="4.5" r="2.8" fill="#FF8A1F" opacity="0.15" />
          </svg>
          <div>
            <span className="font-sans font-semibold text-[14px] tracking-[0.32em] text-nova uppercase leading-none block">
              DEIMOS
            </span>
            <span className="text-[9px] tracking-[0.26em] text-text-muted uppercase leading-none block mt-0.5">
              Intelligence
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center space-y-2">
          <h1 className="text-[42px] md:text-[56px] font-light text-white leading-[1.1] tracking-tight">
            Construa o futuro
            <br />
            com <span className="text-nova italic font-normal">Inteligência.</span>
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-[13px] text-text-muted tracking-[0.08em] text-center max-w-md">
          IA avançada para criadores, empresas e mentes que pensam além.
        </p>

        {/* CTA Button */}
        <button
          onClick={handleLaunch}
          disabled={launching}
          className="group relative mt-4 flex items-center gap-4 px-10 py-4 rounded-full border border-nova/30 bg-nova/[0.04] hover:bg-nova/[0.08] hover:border-nova/50 transition-all duration-300 overflow-hidden disabled:pointer-events-none"
        >
          {/* Shimmer line */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute h-px w-full bottom-0 left-0 bg-gradient-to-r from-transparent via-nova/60 to-transparent animate-shimmer" />
            <div className="absolute h-px w-full top-0 left-0 bg-gradient-to-r from-transparent via-nova/30 to-transparent animate-shimmer-slow" />
          </div>

          <span className="text-[13px] font-semibold tracking-[0.22em] uppercase text-nova/90 group-hover:text-nova transition-colors relative">
            Lançar Nave
          </span>
          <ArrowRight size={16} strokeWidth={1.5} className="text-nova/60 group-hover:text-nova group-hover:translate-x-1 transition-all relative" />
        </button>

        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes shimmer-slow {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-shimmer {
            animation: shimmer 3s ease-in-out infinite;
          }
          .animate-shimmer-slow {
            animation: shimmer-slow 4s ease-in-out infinite;
            animation-delay: 1.5s;
          }
        `}</style>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 z-10 flex flex-col items-center gap-2 opacity-40">
        <div className="w-5 h-8 rounded-full border border-nova/20 flex items-start justify-center pt-1.5">
          <div className="w-0.5 h-1.5 rounded-full bg-nova/50 animate-bounce" />
        </div>
      </div>

    </div>
  );
}
