import React from "react";
export default function ShowcaseGrid() {
  const items = [
    { img: "/eldmatcha/lifestyle1.jpg", title: "Whisked Ritual", href: "/products" },
    { img: "/eldmatcha/lifestyle2.jpg", title: "Daily Calm", href: "/products" },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-6 sm:grid-cols-2">
        {items.map((it, i) => (
          <a key={i} href={it.href} className="group relative block overflow-hidden rounded-2xl">
            <img src={it.img} alt={it.title} className="h-80 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-lg font-medium">{it.title}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
