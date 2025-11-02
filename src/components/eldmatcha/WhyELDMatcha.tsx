import React from "react";
export default function WhyELDMatcha() {
  const features = [
    { title: "Ceremonial Grade", desc: "Shade-grown, first harvest leaves for a naturally sweet umami profile." },
    { title: "Stone-Milled Fresh", desc: "Traditional granite mills preserve aroma, color, and antioxidants." },
    { title: "Clean Energy", desc: "Calm focus from L-theanine. No jitters. No sugar. No crash." },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl text-emerald-950">Why ELDmatcha</h2>
          <p className="mt-2 text-emerald-900/80">Premium matcha, thoughtfully sourced and crafted for daily ritual.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {features.map((f, i) => (
            <div key={i} className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-card">
              <h3 className="text-lg font-medium text-emerald-950">{f.title}</h3>
              <p className="mt-2 text-sm text-emerald-900/80">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
