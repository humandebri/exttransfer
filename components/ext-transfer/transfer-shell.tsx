// components/ext-transfer/transfer-shell.tsx: Transfer画面のレイアウトと背景を担当する。
"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import TransferSidebar from "@/components/ext-transfer/transfer-sidebar";
import TransferWorkspace from "@/components/ext-transfer/transfer-workspace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TransferShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-zinc-100 text-zinc-900 font-sans">
      {/* Atmospheric background gradients to avoid a flat canvas. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-amber-200/50 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-slate-200/80 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-stone-200/70 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-none flex-col items-start gap-4 px-4 py-4 sm:px-6 lg:flex-row">
        <div className="flex w-full items-center justify-between lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              EXT
            </p>
            <p className="text-lg font-semibold tracking-tight text-zinc-900 font-[var(--font-display)]">
              Transfer Studio
            </p>
          </div>
          <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Menu className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="left-0 top-0 h-[100dvh] w-[min(90vw,20rem)] translate-x-0 translate-y-0 rounded-none border-r p-0">
              <DialogTitle className="sr-only">Sidebar</DialogTitle>
              <TransferSidebar
                variant="mobile"
                className="h-full w-full overflow-y-auto rounded-none border-0 bg-white shadow-none"
              />
            </DialogContent>
          </Dialog>
        </div>
        <TransferSidebar variant="desktop" />
        <TransferWorkspace />
      </div>
    </div>
  );
}
