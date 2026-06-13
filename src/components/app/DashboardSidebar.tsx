import { useNavigate, useLocation } from "react-router-dom"
import Logo from "@/components/app/Logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { 
  // Video, 
  BookOpen,
  LayoutDashboard,
  LogOut,
  Compass,
  Settings,
  Notebook,
  X
} from "lucide-react"
import { ModeToggle } from "../mode-toggle"

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const { user, signOut, profile } = useAuth()
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
        name: 'Notes', 
        path: '/notes', 
        icon: Notebook 
    },
    { 
        name: 'Library', 
        path: '/library', 
        icon: BookOpen 
    },
    { 
        name: 'Settings', 
        path: '/settings', 
        icon: Settings 
    },
  ]

  const isActive = (path: string) => location.pathname === path

  const handleNavigate = (path: string) => {
    navigate(path)
    if (onClose) onClose()
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed left-0 top-0 h-full w-64 border-r border-border bg-card/80 backdrop-blur-md transition-transform duration-300 z-50 flex flex-col p-6 shadow-sm lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between mb-10">
          <Logo />
          <div className="flex items-center gap-2">
            <ModeToggle />
            {onClose && (
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
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
                onClick={() => handleNavigate(item.path)}
            >
                <item.icon className="w-4 h-4" />
                {item.name}
            </Button>
          ))}
        </nav>

        <div className="pt-6 border-t border-border mt-auto">
            <div className="flex items-center gap-3 px-2 mb-4 bg-muted/30 p-3 rounded-2xl border border-border/50">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs border border-primary/20 shadow-inner shrink-0 overflow-hidden">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"
                    )}
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
    </>
  )
}

