"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const TOPIC_TO_EMAIL = {
  bug: "oops@nexusarchive.lol",
  feature: "suggestions@nexusarchive.lol",
  deck: "decks@nexusarchive.lol",
  other: "contact@nexusarchive.lol",
} as const;

type TopicKey = keyof typeof TOPIC_TO_EMAIL;

export default function ContactPage() {
  const [topic, setTopic] = useState<TopicKey>("bug");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const topicValue = String(formData.get("topic") || "bug") as TopicKey;
    const email = String(formData.get("email") || "");
    const message = String(formData.get("message") || "");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicValue, email, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message.");
      }

      setStatus("success");
      form.reset();
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong.");
    } finally {
      // reset back to idle after a bit
      setTimeout(() => {
        setStatus("idle");
      }, 4000);
    }
  }

  const destinationEmail = TOPIC_TO_EMAIL[topic];

  return (
    <main className="relative overflow-hidden">
      {/* Arcane-style background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-sky-500/18 blur-3xl" />
        <div className="absolute right-[-6rem] top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-[-10rem] h-72 bg-gradient-to-t from-amber-500/18 via-transparent to-transparent blur-2xl" />
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
        {/* HERO */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-wide text-amber-200/90 shadow-[0_0_18px_rgba(250,204,21,0.35)]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            Contact the Archive
          </div>

          <h1 className="text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
            Found a bug, a broken combo, or a{" "}
            <span className="text-amber-300">genius idea</span>?
          </h1>

          <p className="max-w-xl text-sm text-slate-200/85 sm:text-base">
            This is the unofficial “talk to the lab” page. Use it to report
            bugs, request features, send deck tech, or gently roast any UI that
            looks like it was coded at 3&nbsp;AM. (Because it probably was.)
          </p>
        </section>

        {/* FORM + SIDE INFO */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* FORM */}
          <div className="rounded-2xl border border-white/12 bg-black/65 p-5 shadow-[0_0_28px_rgba(15,23,42,0.95)]">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label
                  htmlFor="topic"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-300"
                >
                  What are you sending?
                </label>
                <select
                  id="topic"
                  name="topic"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none ring-amber-400/40 focus:border-amber-300 focus:ring"
                  defaultValue="bug"
                  onChange={(e) => setTopic(e.target.value as TopicKey)}
                >
                  <option value="bug">Bug report (something exploded)</option>
                  <option value="feature">
                    Feature request (shiny new button)
                  </option>
                  <option value="deck">
                    Deck / combo share (please look at my child)
                  </option>
                  <option value="other">Other (mysterious message)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-300"
                >
                  Email (optional)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 outline-none ring-amber-400/40 focus:border-amber-300 focus:ring"
                />
                <p className="text-[11px] text-slate-400">
                  Only used to reply. No spam, no newsletter, no unsolicited
                  “hey champion, come back” emails.
                </p>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="message"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-300"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="Tell us what broke, what you'd love to see, or why your deck is actually completely balanced..."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 outline-none ring-amber-400/40 focus:border-amber-300 focus:ring"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                This message will be routed to{" "}
                <span className="font-semibold text-amber-200">
                  {destinationEmail}
                </span>
                . Yes, there really is one inbox trying to read them all.
              </p>

              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_22px_rgba(250,204,21,0.6)] transition-transform hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[0_0_30px_rgba(250,204,21,0.9)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {status === "loading" ? "Sending..." : "Send message"}
              </button>

              {status === "success" && (
                <p className="text-[11px] text-emerald-300">
                  Message sent! If you left an email, a human will eventually
                  read this between games.
                </p>
              )}

              {status === "error" && (
                <p className="text-[11px] text-red-400">
                  {errorMessage ||
                    "Something went wrong. Try again in a bit, or poke the dev on another channel."}
                </p>
              )}

              <p className="text-[11px] text-slate-500">
                By using this form, you agree that your message may be lovingly
                archived next to other bug reports and “please nerf this card”
                essays.
              </p>
            </form>
          </div>

          {/* SIDE INFO */}
          <div className="space-y-4 rounded-2xl border border-emerald-400/35 bg-black/65 p-5 text-sm text-slate-300 shadow-[0_0_28px_rgba(15,23,42,0.95)]">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
              Other ways to reach the lab
            </h2>

            <p className="text-sm text-slate-300">
              Prefer sending an email directly? Pick your favorite flavor:
            </p>

            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-semibold text-slate-50">
                  info@nexusarchive.lol
                </span>{" "}
                – general questions, lore, “what even is this site?”
              </li>
              <li>
                <span className="font-semibold text-slate-50">
                  support@nexusarchive.lol
                </span>{" "}
                – something&apos;s not working, but it&apos;s not quite on fire.
              </li>
              <li>
                <span className="font-semibold text-slate-50">
                  oops@nexusarchive.lol
                </span>{" "}
                – full-on bugs, explosions, 500s, or UI that looks cursed.
              </li>
              <li>
                <span className="font-semibold text-slate-50">
                  suggestions@nexusarchive.lol
                </span>{" "}
                – feature ideas, QoL wishes, “what if we added…”
              </li>
              <li>
                <span className="font-semibold text-slate-50">
                  decks@nexusarchive.lol
                </span>{" "}
                – decklists, brews, and combo writeups you&apos;re proud of.
              </li>
              <li>
                <span className="font-semibold text-slate-50">
                  combos@nexusarchive.lol
                </span>{" "}
                – galaxy-brain interactions, infinite loops, and science
                experiments.
              </li>
              <li>
                <span className="font-semibold text-slate-50">
                  hello@nexusarchive.lol
                </span>{" "}
                – just saying hi, sharing vibes, or sending virtual high-fives.
              </li>
              <li>
                <span className="font-semibold text-slate-50">
                  helpme@nexusarchive.lol
                </span>{" "}
                – “I tried to netdeck and somehow made it worse.”
              </li>
              <li>
                <span className="font-semibold text-slate-50">
                  contact@nexusarchive.lol
                </span>{" "}
                – catch-all inbox if you forget which one to pick.
              </li>
            </ul>

            <p className="text-xs text-slate-400">
              All of these ultimately beam into the same human-operated
              Hextech terminal, they&apos;re just sorted so future-you can find
              things later.
            </p>

            <p className="text-[11px] text-slate-500">
              Please don&apos;t send passwords, secret keys, or any spicy
              personal info. Do send wild ideas, cursed combos, and screenshots
              of things that definitely shouldn&apos;t be possible.
            </p>

            <p className="text-[11px] text-slate-500">
              For serious legal questions, see{" "}
              <Link
                href="/legal"
                className="text-amber-300 underline-offset-2 hover:underline"
              >
                tiny little legal stuff →
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
