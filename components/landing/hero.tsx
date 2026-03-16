'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { ArrowRight, FileSearch, ShieldAlert, Store, CalendarCheck } from 'lucide-react'

const USP_ITEMS = [
  {
    icon: FileSearch,
    title: 'AI vytěžování dokladů',
    desc: 'Nahrajte fakturu, AI rozpozná data a navrhne předkontaci.',
  },
  {
    icon: ShieldAlert,
    title: 'Krizové řízení',
    desc: 'Pojistné události, škody a spisy na jednom místě.',
  },
  {
    icon: Store,
    title: 'Marketplace účetních',
    desc: 'Klienti najdou účetní, účetní získají klienty.',
  },
  {
    icon: CalendarCheck,
    title: 'Měsíční uzávěrky',
    desc: 'Přehledný workflow uzávěrek pro desítky firem najednou.',
  },
] as const

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-purple-950 via-indigo-950/80 to-background">
      {/* ── Animated gradient background ── */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#0d1b3e] to-[#0a0118]" />

        {/* Animated orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/20 blur-[120px] animate-[drift_12s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-blue-600/15 blur-[100px] animate-[drift_15s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[30vw] h-[30vw] rounded-full bg-indigo-500/10 blur-[80px] animate-[pulse_8s_ease-in-out_infinite]" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Floating particles */}
        <div className="absolute top-[15%] left-[20%] w-1 h-1 rounded-full bg-purple-400/40 animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute top-[25%] right-[25%] w-1.5 h-1.5 rounded-full bg-blue-400/30 animate-[float_8s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-[30%] left-[35%] w-1 h-1 rounded-full bg-indigo-400/35 animate-[float_7s_ease-in-out_infinite_2s]" />
        <div className="absolute top-[60%] right-[15%] w-0.5 h-0.5 rounded-full bg-purple-300/30 animate-[float_9s_ease-in-out_infinite_3s]" />
        <div className="absolute bottom-[20%] left-[15%] w-1 h-1 rounded-full bg-blue-300/25 animate-[float_10s_ease-in-out_infinite_0.5s]" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 container mx-auto px-4 pt-20 sm:pt-28 pb-36 sm:pb-48">
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-8 animate-[fadeInUp_0.6s_ease-out_both]">
            <Logo size="lg" variant="purple" />
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
            <span className="text-white">Účetní platforma</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400">
              nové generace
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl text-lg sm:text-xl text-gray-400 leading-relaxed animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
            Správa účetnictví pro účetní firmy a jejich klienty.
            Doklady, uzávěrky, komunikace a AI — vše na jednom místě.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
            <Button
              size="lg"
              className="h-14 px-10 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all duration-300"
              asChild
            >
              <Link href="/auth/register">
                Vyzkoušet zdarma
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="default"
              className="h-14 px-10 text-base text-white bg-white/25 border-2 border-white/40 hover:bg-white/35 backdrop-blur-sm transition-all duration-300 font-semibold"
              asChild
            >
              <a href="#pricing">Zobrazit ceník</a>
            </Button>
          </div>

          <p className="mt-4 text-sm text-gray-500 animate-[fadeInUp_0.6s_ease-out_0.4s_both]">
            Bez platební karty. 30 dní plný přístup.
          </p>

          {/* ── USP Grid ── */}
          <div className="mt-20 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-[fadeInUp_0.6s_ease-out_0.5s_both]">
            {USP_ITEMS.map((item, i) => (
              <div
                key={item.title}
                className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-5 text-left transition-all duration-300 hover:border-purple-500/20 hover:bg-white/[0.04]"
                style={{ animationDelay: `${0.5 + i * 0.1}s` }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/5 group-hover:to-blue-600/5 transition-all duration-300" />

                <div className="relative">
                  <div className="mb-3 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/10">
                    <item.icon className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom fade to page bg ── */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      {/* ── Keyframe styles ── */}
      <style jsx>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-20px); opacity: 0.8; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}
