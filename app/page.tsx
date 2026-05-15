"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);

  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(() => router.push("/dashboard"), 800);
  };

  return (
    <div className={`fixed inset-0 bg-black overflow-hidden transition-all duration-[800ms] ease-[cubic-bezier(0.4,0,0,1)] ${launching ? "scale-[2] opacity-0" : "scale-100 opacity-100"}`}>

      {/* ══════ Fluid gradient background ══════ */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[80%] rounded-full opacity-65"
          style={{ background: "radial-gradient(ellipse at 60% 40%, #FF8A1F 0%, #FF6B00 25%, #C2410C 50%, transparent 70%)", filter: "blur(70px)", animation: "fluid-drift 10s ease-in-out infinite" }}
        />
        <div className="absolute top-[25%] -left-[15%] w-[55%] h-[65%] rounded-full opacity-35"
          style={{ background: "radial-gradient(ellipse at 50% 50%, #FF8A1F 0%, #F4C430 30%, transparent 65%)", filter: "blur(80px)", animation: "fluid-drift2 12s ease-in-out infinite" }}
        />
        <div className="absolute -bottom-[10%] right-[15%] w-[45%] h-[45%] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #F4C430 0%, #FF8A1F 40%, transparent 70%)", filter: "blur(75px)", animation: "fluid-drift3 14s ease-in-out infinite" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      </div>

      {/* ══════ Content — centered hero only ══════ */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        <h1 className="text-[48px] md:text-[64px] lg:text-[72px] font-display font-light text-white leading-[1.05] tracking-tight text-center max-w-4xl opacity-0 animate-[heroFadeIn_1.2s_ease-out_0.3s_forwards]">
          Inteligencia artificial
          <br />
          para{" "}
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #FF8A1F, #F4C430, #FF6B00)" }}>
            direct response
          </span>
        </h1>

        <p className="text-[15px] md:text-[17px] text-white/50 text-center mt-6 max-w-lg leading-relaxed font-light opacity-0 animate-[heroFadeIn_1.2s_ease-out_0.8s_forwards]">
          Espione ofertas, crie copy com IA, simule clientes<br className="hidden md:block" /> e escale suas vendas com dados reais.
        </p>

        <div className="mt-12 opacity-0 animate-[heroFadeIn_1s_ease-out_1.4s_forwards]">
          <button onClick={handleLaunch} disabled={launching} className="cta-hero group">
            <span className="relative z-10 flex items-center gap-3">
              Acessar plataforma
              <ArrowRight size={15} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fluid-drift {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          20% { transform: translate(-8%, 10%) scale(1.08) rotate(4deg); }
          40% { transform: translate(5%, -3%) scale(0.96) rotate(-2deg); }
          60% { transform: translate(-3%, -8%) scale(1.04) rotate(2deg); }
          80% { transform: translate(6%, 5%) scale(0.98) rotate(-3deg); }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        }
        @keyframes fluid-drift2 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          25% { transform: translate(10%, -8%) scale(1.12) rotate(3deg); }
          50% { transform: translate(-5%, 6%) scale(0.94) rotate(-4deg); }
          75% { transform: translate(3%, -4%) scale(1.06) rotate(2deg); }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        }
        @keyframes fluid-drift3 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          30% { transform: translate(-8%, 5%) scale(1.10) rotate(6deg); }
          60% { transform: translate(6%, -6%) scale(0.90) rotate(-4deg); }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
