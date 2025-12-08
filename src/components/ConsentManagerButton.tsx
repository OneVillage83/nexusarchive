"use client";

export function ConsentManagerButton() {
  const handleClick = () => {
    if (typeof window === "undefined") return;

    // Google CMP (Funding Choices) exposes the IAB TCF API as __tcfapi
    // When present, this will re-open the consent dialog.
    // @ts-ignore
    const tcfApi = window.__tcfapi;

    if (typeof tcfApi === "function") {
      try {
        // showConsentManager is defined by the TCF spec
        // Version 2 callback signature: (returnValue, success)
        tcfApi("showConsentManager", 2, () => {});
      } catch (err) {
        console.warn("Unable to open consent manager:", err);
      }
    } else {
      // Optional: fall back to a gentle message if CMP isn't loaded
      alert(
        "The consent manager isn’t available right now. Try refreshing the page."
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-1 text-[11px] text-amber-200 underline underline-offset-2 hover:text-amber-100"
    >
      Manage cookie & ad consent
    </button>
  );
}
