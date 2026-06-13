import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import api from "@/lib/api"
import { 
  ChevronLeft, 
  Play, 
  Plus, 
  Clock, 
  BookOpen,
  Calendar,
  Layers,
  Users
} from "lucide-react"
import DashboardLayout from "@/components/app/DashboardLayout"

interface PathDetail {
// ... (interface unchanged)
    id: string;
    name: string;
    description?: string;
    cover_url?: string;
    initial_url?: string;
    queue: any[];
    created_at: string;
    user_id: string;
    profiles?: {
        full_name: string;
        email: string;
        avatar_url?: string;
    }
}

export default function PathDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [path, setPath] = useState<PathDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPath = async () => {
      try {
        const res = await api.get<{ data: PathDetail }>(`sessions/${id}`)
        setPath(res.data)
      } catch (error) {
        console.error("Failed to load path details", error)
      } finally {
        setLoading(false)
      }
    }
    loadPath()
  }, [id])

  const handleJoin = async () => {
    if (!user) {
        alert("Please log in to join this learning path!")
        return
    }
    if (!path) return

    if (user.id === path.user_id) {
        navigate("/dashboard")
        return
    }

    try {
        await api.post("sessions", {
            name: `${path.name} (Cloned)`,
            initialUrl: path.initial_url,
            queue: path.queue,
            description: path.description,
            coverUrl: path.cover_url,
            isPublic: false
        })
        alert("Learning path joined!")
        navigate("/dashboard")
    } catch (error) {
        console.error("Failed to join path", error)
        alert("Failed to join path. Please try again.")
    }
  }

  const handlePreview = () => {
    if (!path?.initial_url) return

    const url = path.initial_url
    let videoId = ""
    let playlistId = ""
    try {
      const urlToParse = url.includes("://") ? url : `https://${url}`
      const parsedUrl = new URL(urlToParse)
      if (parsedUrl.hostname.includes("youtube.com")) {
        videoId = parsedUrl.searchParams.get("v") || ""
        playlistId = parsedUrl.searchParams.get("list") || ""
      } else if (parsedUrl.hostname.includes("youtu.be")) {
        videoId = parsedUrl.pathname.slice(1)
      }
    } catch (err) {
      if (url.length === 11) videoId = url
    }

    const params = new URLSearchParams()
    if (videoId) params.set("v", videoId)
    if (playlistId) params.set("list", playlistId)
    params.set("preview", "true")
    if (path?.id) params.set("sessionId", path.id)

    navigate(`/watch?${params.toString()}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!path) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Path not found</h2>
        <Button onClick={() => navigate("/explore")}>Back to Explore</Button>
    </div>
  )

  const isOwner = user?.id === path.user_id

  return (
    <DashboardLayout>
      <div className="-mt-24 lg:-mt-10 lg:-ml-10 lg:-mr-10">
        {/* Hero Section */}
        <div className="relative h-[400px] w-full overflow-hidden">
            {path.cover_url ? (
                <img src={path.cover_url} alt={path.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-linear-to-br from-primary/20 via-background to-background" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />

            <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full max-w-7xl mx-auto">
                <Button 
                    variant="ghost" 
                    className="mb-6 gap-2 hover:bg-background/20 text-foreground"
                    onClick={() => navigate("/explore")}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Explore
                </Button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-primary/20">
                                Learning Path
                            </span>
                            <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {path.queue.length} Videos
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight">{path.name}</h1>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/10 overflow-hidden shrink-0">
                                {path.profiles?.avatar_url ? (
                                    <img src={path.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    path.profiles?.full_name?.[0] || "?"
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold">Curated by {path.profiles?.full_name || "Anonymous Student"}</p>
                                <p className="text-xs text-muted-foreground">Published on {new Date(path.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button 
                            onClick={handleJoin}
                            className="h-14 px-8 rounded-2xl font-bold gap-3 shadow-xl shadow-primary/20 text-lg transition-all active:scale-95"
                        >
                            {isOwner ? (
                                <>
                                    <Users className="w-5 h-5" />
                                    Manage Path
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Join this Path
                                </>
                            )}
                        </Button>
                        {path.initial_url && (
                             <Button 
                                variant="outline"
                                className="h-14 px-6 rounded-2xl border-2 font-bold gap-3 transition-all active:scale-95"
                                onClick={handlePreview}
                            >
                                <Play className="w-5 h-5" />
                                Preview
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Content Section */}
        <div className="p-8 md:p-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-primary" />
                        About this Path
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">
                        {path.description || "No description provided for this learning path. Join the path to explore the curated content and start your learning journey!"}
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Layers className="w-5 h-5 text-primary" />
                        Curated Content ({path.queue.length} videos)
                    </h2>
                    <div className="space-y-4">
                        {path.queue.map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-5 rounded-3xl bg-muted/20 border border-border/50 group hover:bg-muted/40 transition-all">
                                <div className="w-10 h-10 rounded-2xl bg-background border border-border flex items-center justify-center text-sm font-bold group-hover:border-primary/30 transition-all">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-foreground truncate">{item.title}</h4>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Video Resource</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="space-y-8">
                <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Path Statistics
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total Resources</span>
                            <span className="font-bold">{path.queue.length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Est. Completion</span>
                            <span className="font-bold">{path.queue.length * 15} mins</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Difficulty</span>
                            <span className="font-bold text-primary">Mixed</span>
                        </div>
                    </div>
                </div>

                <div className="bg-primary/5 border border-primary/10 p-8 rounded-[2.5rem] text-center">
                    <p className="text-sm font-medium mb-4">Start your structured learning journey today.</p>
                    <Button onClick={handleJoin} className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/10">
                        {isOwner ? "Go to Dashboard" : "Join Community Path"}
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
