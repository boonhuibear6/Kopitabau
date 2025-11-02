import React from "react";
import HeroPremium from "../components/eldmatcha/HeroPremium";
import TrustStrip from "../components/eldmatcha/TrustStrip";
import WhyELDMatcha from "../components/eldmatcha/WhyELDMatcha";
import ShowcaseGrid from "../components/eldmatcha/ShowcaseGrid";

export default function EldmatchaPreview() {
  return (
    <main className="bg-white">
      <HeroPremium />
      <TrustStrip />
      <WhyELDMatcha />
      <ShowcaseGrid />
    </main>
  );
}
