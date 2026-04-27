import { loadEnvConfig } from "@next/env";
import type { CapacitorConfig } from "@capacitor/cli";

loadEnvConfig(process.cwd());

function splitHosts(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const hostedUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://nexusarchive.lol";

const allowNavigation = new Set(
  splitHosts(process.env.CAPACITOR_ALLOWED_HOSTS).length
    ? splitHosts(process.env.CAPACITOR_ALLOWED_HOSTS)
    : ["nexusarchive.lol"],
);

if (hostedUrl) {
  try {
    allowNavigation.add(new URL(hostedUrl).hostname);
  } catch {
    // Keep the config loadable even if the URL is being filled in locally.
  }
}

const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID?.trim() || "lol.nexusarchive",
  appName: process.env.CAPACITOR_APP_NAME?.trim() || "NexusArchive",
  webDir: "mobile-shell",
  server: hostedUrl
    ? {
        url: hostedUrl,
        cleartext: hostedUrl.startsWith("http://"),
        allowNavigation: Array.from(allowNavigation),
      }
    : undefined,
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#020617",
      showSpinner: false,
      androidSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
