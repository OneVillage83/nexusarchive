import { SignIn } from "@clerk/nextjs";

import { isClerkConfigured } from "@/lib/auth-config";

type SignInPageProps = {
  searchParams: Promise<{
    redirect_url?: string | string[];
  }>;
};

function getRedirectTarget(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "/";
  }

  return value || "/";
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectTarget = getRedirectTarget(resolvedSearchParams.redirect_url);
  const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent(redirectTarget)}`;

  if (!isClerkConfigured()) {
    return (
      <main className="flex min-h-[calc(100vh-14rem)] items-center justify-center py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-black/60 p-6 text-center shadow-[0_0_30px_rgba(0,0,0,0.75)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/90">
            Auth setup pending
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-50">
            Clerk keys are missing here
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            This environment does not have the Clerk secrets configured yet, so
            the sign-in form is taking a nap instead of throwing a server fit.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-14rem)] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-black/60 p-5 shadow-[0_0_30px_rgba(0,0,0,0.75)]">
        <div className="mb-4 space-y-2 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/90">
            NexusArchive Access
          </p>
          <h1 className="text-2xl font-semibold text-slate-50">
            Log back into the archive
          </h1>
          <p className="text-sm text-slate-300">
            Same archive. Same jokes. Slightly more account infrastructure than
            before.
          </p>
        </div>

        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl={signUpUrl}
            fallbackRedirectUrl={redirectTarget}
            forceRedirectUrl={redirectTarget}
          />
        </div>
      </div>
    </main>
  );
}
