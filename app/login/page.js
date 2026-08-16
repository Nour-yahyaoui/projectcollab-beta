"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { Terminal, AlertCircle } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const error = params.get("error");

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent-light text-accent">
        <Terminal className="size-5" strokeWidth={2.25} aria-hidden />
      </span>
      <h1 className="mt-4 font-display text-xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Discover projects, find collaborators, build together.
      </p>

      {error && (
        <div className="mt-5 flex w-full items-start gap-2 rounded-lg bg-danger-light px-3.5 py-2.5 text-left text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>Something went wrong signing you in. Please try again.</span>
        </div>
      )}

      <div className="mt-7 flex w-full flex-col gap-3">
        <a
          href="/api/auth/github"
          className="flex items-center justify-center gap-2.5 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          <FaGithub className="size-4" aria-hidden />
          Continue with GitHub
        </a>
        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-canvas"
        >
          <FaGoogle className="size-4" aria-hidden />
          Continue with Google
        </a>
      </div>
    </div>
  );
}
