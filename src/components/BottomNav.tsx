import { NavLink } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Target, Award } from "lucide-react";

const links = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/logs", icon: ClipboardList, label: "Logs" },
  { to: "/targets", icon: Target, label: "Targets" },
  { to: "/scorecard", icon: Award, label: "Scorecard" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgba(255,255,255,0.07)] bg-[rgba(13,15,14,0.92)] backdrop-blur-[20px]">
      <div className="mx-auto flex max-w-[420px] items-center justify-around py-3 pb-5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 transition-opacity relative ${
                isActive ? "opacity-100" : "opacity-40 hover:opacity-60"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span className={`font-mono-dm text-[9px] uppercase tracking-[0.12em] ${
                  isActive ? "text-moss-light" : "text-mist"
                }`}>{label}</span>
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-moss-light" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
