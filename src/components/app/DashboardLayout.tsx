import React, { useState } from "react"
import DashboardSidebar from "./DashboardSidebar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import Logo from "./Logo"

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <DashboardSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/80 backdrop-blur-md z-40 flex items-center justify-between px-4">
        <Logo />
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="lg:ml-64 p-6 md:p-10 max-w-7xl mx-auto min-h-screen pt-24 lg:pt-10">
        {children}
      </main>
    </div>
  )
}
