import { NavLink } from "react-router-dom"
import { Home, LineChart, Settings, HelpCircle } from "lucide-react"
import { cn } from "@/guardian/lib/utils"

const items = [
  { to: "/guardian/home", label: "홈", icon: Home },
  { to: "/guardian/records", label: "기록", icon: LineChart },
  { to: "/guardian/settings", label: "설정", icon: Settings },
  { to: "/guardian/help", label: "도움말", icon: HelpCircle },
]

export function BottomNav() {
  return (
    <nav
      aria-label="주요 메뉴"
      className="sticky bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur"
    >
      <ul className="flex items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5 text-xs font-medium transition",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} aria-hidden />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
