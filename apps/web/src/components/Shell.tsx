import {
  Activity,
  Blocks,
  Bot,
  Boxes,
  FileText,
  LayoutDashboard,
  PlayCircle,
  Workflow
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/automations", label: "Automations", icon: Workflow },
  { to: "/templates", label: "Templates", icon: Boxes },
  { to: "/runs", label: "Runs", icon: Activity },
  { to: "/artifacts", label: "Artifacts", icon: FileText }
];

export function Shell() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-zinc-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-200 bg-[#171717] text-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
            <div className="grid size-9 place-items-center rounded-lg bg-cyan-400 text-zinc-950">
              <Bot size={20} />
            </div>
            <div>
              <div className="text-sm font-bold">FlowPilot</div>
              <div className="text-xs text-zinc-400">Automation Command Center</div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? "bg-white text-zinc-950" : "text-zinc-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="m-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <PlayCircle size={16} className="text-emerald-300" />
              Local only
            </div>
            <p className="mt-1 text-xs leading-5 text-zinc-400">SQLite, sandboxed files, no external tokens.</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid size-9 place-items-center rounded-lg bg-zinc-950 text-cyan-300">
                <Bot size={20} />
              </div>
              <span className="font-bold">FlowPilot</span>
            </div>
            <div className="hidden items-center gap-2 text-sm text-zinc-500 lg:flex">
              <Blocks size={16} />
              <span>Local automation workspace</span>
            </div>
            <nav className="flex gap-1 overflow-x-auto lg:hidden">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `rounded-lg p-2 ${isActive ? "bg-zinc-950 text-white" : "text-zinc-600"}`
                  }
                  title={item.label}
                >
                  <item.icon size={18} />
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
        <main className="flow-grid min-h-[calc(100vh-4rem)] px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
