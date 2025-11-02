import React from "react";
export default function TrustStrip() {
  const items = [
    { t: "Authentic • Japan-sourced" },
    { t: "Halal-friendly • No additives" },
    { t: "Secure checkout • SSL" },
    { t: "30-day satisfaction" },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((i, idx) => (
          <div key={idx} className="text-sm text-emerald-950/80 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
            {i.t}
          </div>
        ))}
      </div>
    </section>
  );
}
