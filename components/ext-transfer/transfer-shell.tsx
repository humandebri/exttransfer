// components/ext-transfer/transfer-shell.tsx: Layout wrapper that applies the background and grid.
import TransferSidebar from "@/components/ext-transfer/transfer-sidebar";
import TransferWorkspace from "@/components/ext-transfer/transfer-workspace";

export default function TransferShell() {
  return (
    <div className="relative min-h-screen bg-zinc-100 text-zinc-900 font-sans">
      {/* Atmospheric background gradients to avoid a flat canvas. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-amber-200/50 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-slate-200/80 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-stone-200/70 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl gap-6 px-4 py-6 sm:px-6">
        <TransferSidebar />
        <TransferWorkspace />
      </div>
    </div>
  );
}
