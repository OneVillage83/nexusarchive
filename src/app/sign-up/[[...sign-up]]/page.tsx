import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-[calc(100vh-14rem)] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-black/60 p-5 shadow-[0_0_30px_rgba(0,0,0,0.75)]">
        <div className="mb-4 space-y-2 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/90">
            NexusArchive Access
          </p>
          <h1 className="text-2xl font-semibold text-slate-50">
            Create your archive account
          </h1>
          <p className="text-sm text-slate-300">
            One login. Multiple game wings. Considerably fewer excuses for not
            saving your decklists.
          </p>
        </div>

        <div className="flex justify-center">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/"
          />
        </div>
      </div>
    </main>
  );
}
