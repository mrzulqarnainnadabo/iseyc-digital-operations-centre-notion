export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-semibold">Something needs attention</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}
