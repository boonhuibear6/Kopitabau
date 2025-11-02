import React from "react";
export default function HeroPremium() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0">
        <img src="/eldmatcha/hero.jpg" alt="Ceremonial matcha whisked to perfection" className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-white"></div>
      </div>
      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-28 lg:py-32">
        <div className="max-w-2xl">
          <p className="text-sm tracking-widest text-emerald-800/80">JAPAN • STONE-MILLED • CEREMONIAL</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-emerald-950 sm:text-5xl">
            Ceremonial-Grade Matcha.<br/>Calm, Focused Energy.
          </h1>
          <p className="mt-4 text-base text-emerald-900/80">
            Single-origin leaves, shade-grown and stone-milled for a smooth umami finish. No jitters. No crash.
          </p>
          <div className="mt-8 flex gap-3">
            <a href="/products" className="inline-flex items-center rounded-xl bg-emerald-700 px-5 py-3 text-white hover:bg-emerald-800 transition">
              Shop Matcha
            </a>
            <a href="/brew-guide" className="inline-flex items-center rounded-xl border border-emerald-900/15 bg-white px-5 py-3 text-emerald-900 hover:border-emerald-900/30 transition">
              Brew Guide
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
