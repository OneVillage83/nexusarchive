"use client";

import { Capacitor } from "@capacitor/core";

export function isNativeAppShell() {
  return Capacitor.isNativePlatform();
}

export function isNativePlatform(platform: "ios" | "android") {
  return Capacitor.getPlatform() === platform;
}

export async function openUrlInSystemBrowser(url: string) {
  if (isNativeAppShell()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
