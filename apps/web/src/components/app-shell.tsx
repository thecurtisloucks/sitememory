import { BrainCircuit, Github, ScanSearch } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { CreateRoomDialog } from "./create-room-dialog";

export function AppShell() {
  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_75%_0%,rgba(110,231,199,0.08),transparent_34%)]" />
      <header className="sticky top-0 z-30 border-b border-line/80 bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-signal/25 bg-signal/10 text-signal shadow-glow">
              <BrainCircuit size={20} />
            </span>
            <span className="font-semibold tracking-tight">SiteMemory</span>
          </NavLink>
          <div className="flex items-center gap-1 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 md:flex">
              <ScanSearch size={14} className="text-signal" /> Foundation online
            </span>
            <a
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              href="https://github.com"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>
            <CreateRoomDialog compact />
          </div>
        </div>
      </header>
      <main className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
