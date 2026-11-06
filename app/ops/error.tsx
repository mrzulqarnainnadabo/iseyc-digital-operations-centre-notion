"use client";

import { useEffect } from "react";

type OpsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function OpsError({ error, reset }: OpsErrorProps) {
  useEffect(() => {
    // Keep diagnostics minimal: never render or log raw exception messages.
    if (error.digest) console.error("DOC operations view failed", { digest: error.digest });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center">
      <section role="alert" className="w-full rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">Operations view unavailable</p>
        <h2 className="mt-2 font-serif text-2xl text-slate-950">This section could not be loaded</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The request did not complete. No record was changed by this screen. Try loading the section again;
          if the problem continues, contact the system administrator through the approved support channel.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-[#0b3a2b] px-4 text-sm font-semibold text-white hover:bg-[#14543d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b3a2b]"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
