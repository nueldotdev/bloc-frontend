import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import api from "@/lib/api"
import { 
  Plus, 
  Clock, 
  ChevronRight, 
  Search, 
  BookOpen,
  Trash2,
  Edit3,
  Globe,
  Lock
} from "lucide-react"
import { type Session } from "@/components/sidebar/InteractiveSidebar"
import DashboardSidebar from "@/components/app/DashboardSidebar"

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState("")
  const [newSessionName, setNewSessionName] = useState("")
  const [initialUrl, setInitialUrl] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate("/")
      return
    }

    const loadSessions = async () => {
      try {
        const res = await api.get<{ data: any[] }>("sessions")
        setSessions(res.data)
      } catch (error) {
        console.error("Failed to load sessions", error)
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
  }, [user, navigate])

  const handleStartLearning = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    const { videoId, playlistId } = parseYoutubeId(url)
    const params = new URLSearchParams()
    if (videoId) params.set("v", videoId)
    if (playlistId) params.set("list", playlistId)
    navigate(`/watch?${params.toString()}`)
  }

  const parseYoutubeId = (urlStr: string) => {
    let videoId = ""
    let playlistId = ""
    try {
      const urlToParse = urlStr.includes("://") ? urlStr : `https://${urlStr}`
      const parsedUrl = new URL(urlToParse)
      if (parsedUrl.hostname.includes("youtube.com")) {
        videoId = parsedUrl.searchParams.get("v") || ""
        playlistId = parsedUrl.searchParams.get("list") || ""
        if (!videoId) {
            const paths = parsedUrl.pathname.split("/")
            if (paths[1] === "shorts" || paths[1] === "embed" || paths[1] === "v") {
                videoId = paths[2]
            }
        }
      } else if (parsedUrl.hostname.includes("youtu.be")) {
        videoId = parsedUrl.pathname.slice(1)
      }
    } catch (err) {
      if (urlStr.length === 11) videoId = urlStr
    }
    return { videoId, playlistId }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSessionName.trim()) return
    
    setIsCreating(true)
    try {
      const res = await api.post<{ data: Session }>("sessions", { 
        name: newSessionName.trim(),
        initialUrl: initialUrl.trim()
      })
      setSessions(prev => [res.data, ...prev])
      setNewSessionName("")
      setInitialUrl("")
    } catch (error) {
      console.error("Failed to create session", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this session? All notes and chats within it will be lost.")) return

    try {
      await api.delete(`sessions/${id}`)
      setSessions(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error("Failed to delete session", error)
    }
  }

  const handleUpdateSession = async (id: string, currentSession: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const newName = prompt("Enter new session name:", currentSession.name)
    if (newName === null) return

    const newDescription = prompt("Enter session description:", currentSession.description || "")
    if (newDescription === null) return

    try {
      const res = await api.put<{ data: Session }>(`sessions/${id}`, { 
          name: newName || currentSession.name,
          description: newDescription
      })
      setSessions(prev => prev.map(s => s.id === id ? res.data : s))
    } catch (error) {
      console.error("Failed to update session", error)
    }
  }

  const jumpToSession = (session: any) => {
    localStorage.setItem("bloc_active_session_id", session.id)
    
    if (session.initial_url) {
        const { videoId, playlistId } = parseYoutubeId(session.initial_url)
        const params = new URLSearchParams()
        if (videoId) params.set("v", videoId)
        if (playlistId) params.set("list", playlistId)
        navigate(`/watch?${params.toString()}`)
    } else {
        navigate("/watch")
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const getSubGreeting = () => {
    const hour = new Date().getHours()
    
    const messages = {
      morning: [
        "Rise and grind! Ready to tackle that queue?",
        "Coffee in hand, knowledge in mind.",
        "The early bird gets the breakthroughs.",
        "Fresh start, fresh insights. Let's go.",
        "Morning! What are we mastering today?"
      ],
      afternoon: [
        "Mid-day momentum! Let's keep it rolling.",
        "Crushing those goals? Let's add one more.",
        "Perfect time for a learning breakthrough.",
        "Stay focused. You're making great progress.",
        "The sun is high, and so is your potential."
      ],
      evening: [
        "Finishing the day strong, I see!",
        "Quiet hours are the best for deep focus.",
        "Wrapping up the day with some sharp insights.",
        "One more session before we call it a night?",
        "Reflecting on today, preparing for tomorrow."
      ],
      night: [
        "The night owl studies again! 🦉",
        "While the world sleeps, you grow.",
        "Deep focus in the quiet of the night.",
        "Burning the midnight oil? Let's make it count.",
        "Midnight insights are often the clearest."
      ]
    }

    let category: keyof typeof messages = 'morning'
    if (hour >= 5 && hour < 12) category = 'morning'
    else if (hour >= 12 && hour < 17) category = 'afternoon'
    else if (hour >= 17 && hour < 22) category = 'evening'
    else category = 'night'

    const categoryMessages = messages[category]
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)]
  }

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name || "Learner"
  const [subGreeting] = useState(getSubGreeting())

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/10 text-foreground">
      <DashboardSidebar />

      {/* Main Content */}
      <main className="lg:ml-64 p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight mb-1 text-foreground">{getGreeting()}, {displayName}</h1>
                <p className="text-muted-foreground text-sm font-medium opacity-80">{subGreeting}</p>
            </div>
            
            <form onSubmit={handleStartLearning} className="relative w-full max-w-md group">
                <Input 
                    placeholder="Quick Start: Paste YouTube URL..."
                    className="pl-12 h-14 rounded-2xl border-2 focus:ring-4 focus:ring-primary/10 transition-all bg-card shadow-sm border-border/60"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Button type="submit" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl h-10 px-4 font-bold shadow-md">
                    Start
                </Button>
            </form>
        </header>

        {/* Create Session Area */}
        <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 flex flex-col xl:flex-row items-center justify-between gap-8 shadow-sm">
                <div className="max-w-md">
                    <h2 className="text-2xl font-bold mb-2 text-foreground flex items-center gap-3">
                         <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                            <Plus className="w-6 h-6" />
                         </div>
                         Start a new session
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium opacity-80">Organize your notes, AI chats, and topics by subject or project.</p>
                </div>
                <form onSubmit={handleCreateSession} className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                    <Input 
                        placeholder="Session name (e.g. CS101 Prep)"
                        className="h-12 md:w-56 rounded-xl bg-background border-2 shadow-sm focus:border-primary/50"
                        value={newSessionName}
                        onChange={(e) => setNewSessionName(e.target.value)}
                    />
                    <Input 
                        placeholder="YouTube URL (Optional)"
                        className="h-12 md:w-80 rounded-xl bg-background border-2 shadow-sm focus:border-primary/50"
                        value={initialUrl}
                        onChange={(e) => setInitialUrl(e.target.value)}
                    />
                    <Button type="submit" disabled={isCreating} className="h-12 px-8 rounded-xl font-bold gap-2 whitespace-nowrap shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                        {isCreating ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Plus className="w-5 h-5" />}
                        Create
                    </Button>
                </form>
            </div>
        </section>

        {/* Sessions Grid */}
        <section className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-3 text-foreground">
                    Recent Sessions
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2.5 py-1 rounded-full bg-muted border border-border shadow-sm">
                        {sessions.length}
                    </span>
                </h2>
                <Button variant="ghost" className="text-primary text-sm font-bold hover:bg-primary/10 rounded-xl px-4 transition-all">View All</Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-[2rem] bg-muted/50 animate-pulse border border-border/40" />
                    ))}
                </div>
            ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-muted/10 rounded-[3rem] border border-dashed border-border/60">
                    <div className="w-20 h-20 rounded-[2rem] bg-background flex items-center justify-center mb-6 shadow-sm border border-border/40">
                        <BookOpen className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                    <h3 className="font-bold text-xl mb-2 text-foreground">No sessions found</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">Create your first session above to start organizing your learning journey.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sessions.map((session) => (
                        <div 
                            key={session.id}
                            onClick={() => jumpToSession(session)}
                            className="group relative bg-card hover:bg-muted/20 border border-border/60 rounded-[2rem] p-7 transition-all cursor-pointer hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 flex flex-col min-h-[220px]"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-3.5 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm shadow-primary/5 border border-primary/10">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className={`h-9 w-9 rounded-xl shadow-sm border border-border/40 transition-all ${(session as any).is_public ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                                        title={(session as any).is_public ? "Publicly Shared" : "Private"}
                                        onClick={async (e) => {
                                            e.stopPropagation()
                                            try {
                                                const res = await api.put<{ data: any }>(`sessions/${session.id}`, { isPublic: !(session as any).is_public })
                                                setSessions(prev => prev.map(s => s.id === session.id ? res.data : s))
                                            } catch (error) {
                                                console.error("Failed to toggle privacy", error)
                                            }
                                        }}
                                    >
                                        {(session as any).is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-background shadow-sm border border-border/40 transition-all"
                                        onClick={(e) => handleUpdateSession(session.id, session, e)}
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shadow-sm border border-border/40 transition-all"
                                        onClick={(e) => handleDeleteSession(session.id, e)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="flex-1">
                                <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors truncate pr-2 text-foreground">
                                    {session.name}
                                </h3>
                                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-80">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                    {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>

                            <div className="mt-6 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-3 group-hover:translate-x-0">
                                OPEN WORKSPACE <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
      </main>
    </div>
  )
}
