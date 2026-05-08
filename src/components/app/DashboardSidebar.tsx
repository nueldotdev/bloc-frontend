import { useNavigate, useLocation } from "react-router-dom"
import Logo from "@/components/app/Logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { 
  Video, 
  BookOpen,
  LayoutDashboard,
  LogOut,
  Compass
} from "lucide-react"
import { ModeToggle } from "../mode-toggle"

export default function DashboardSidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { 
        name: 'Dashboard', 
        path: '/dashboard', 
        icon: LayoutDashboard 
    },
    { 
        name: 'Explore', 
        path: '/explore', 
        icon: Compass 
    },
    { 
        name: 'Library', 
        path: '/library', 
        icon: BookOpen 
    },
    { 
        name: 'Watch Mode', 
        path: '/watch', 
        icon: Video 
    },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-card/50 backdrop-blur-sm hidden lg:flex flex-col p-6 shadow-sm z-50">
        <div className="flex items-center justify-between mb-10">
          <Logo />
          <ModeToggle />
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Button 
                key={item.path}
                variant={isActive(item.path) ? "secondary" : "ghost"} 
                className={`w-full justify-start gap-3 rounded-xl transition-all font-semibold ${
                    isActive(item.path) 
                    ? "bg-primary/10 text-primary hover:bg-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => navigate(item.path)}
            >
                <item.icon className="w-4 h-4" />
                {item.name}
            </Button>
          ))}
        </nav>

        <div className="pt-6 border-t border-border mt-auto">
            <div className="flex items-center gap-3 px-2 mb-4 bg-muted/30 p-3 rounded-2xl border border-border/50">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs border border-primary/20 shadow-inner">
                    {user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 truncate">
                    <p className="text-[11px] font-bold truncate text-foreground">{user?.email}</p>
                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Free Student Plan</p>
                </div>
            </div>
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-all" onClick={signOut}>
                <LogOut className="w-4 h-4" />
                Sign Out
            </Button>
        </div>
    </aside>
  )
}
