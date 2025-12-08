"use client";

import { useEffect } from "react";

type AdUnitProps = {
  slot: string;           // AdSense ad slot ID
  className?: string;     // Optional extra Tailwind classes
};

const isProd = process.env.NODE_ENV === "production";

export default function AdUnit({ slot, className }: AdUnitProps) {
  useEffect(() => {
    if (!isProd) return; // don't run ads in dev

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      // quiet fail is fine; avoids crashing the page
      console.error("Adsense error", err);
    }
  }, []);

  if (!isProd) {
    // In development, render nothing so you don't see test ads / errors
    return null;
  }

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client="ca-pub-4511788937363503"
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
