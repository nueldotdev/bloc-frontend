import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import api from "@/lib/api"
import { 
  Play, 
  Trash2, 
  Search, 
  BookOpen,
  Video
} from "lucide-react"
import DashboardSidebar from "@/components/app/DashboardSidebar"

interface SavedVideo {
    id: string;
    video_id: string;
    title: string;
    thumbnail_url?: string;
    created_at: string;
}

export default function Library() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [videos, setVideos] = useState<SavedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!user) {
      navigate("/")
      return
    }

    const loadLibrary = async () => {
      try {
        const res = await api.get<{ data: SavedVideo[] }>("library")
        setVideos(res.data)
      } catch (error) {
        console.error("Failed to load library", error)
      } finally {
        setLoading(false)
      }
    }

    loadLibrary()
  }, [user, navigate])

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.delete(`library/${id}`)
      setVideos(prev => prev.filter(v => v.id !== id))
    } catch (error) {
      console.error("Failed to remove from library", error)
    }
  }

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <DashboardSidebar />

      <main className="lg:ml-64 p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight mb-1">Your Library</h1>
                <p className="text-muted-foreground text-sm font-medium opacity-80">Saved videos for focused study.</p>
            </div>
            
            <div className="relative w-full max-w-md group">
                <input 
                    placeholder="Search your library..."
                    className="w-full pl-12 h-12 rounded-2xl border-2 border-border/60 focus:ring-4 focus:ring-primary/10 transition-all bg-card shadow-sm focus:outline-none focus:border-primary/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="aspect-video rounded-[2rem] bg-muted/50 animate-pulse border border-border/40" />
                    ))}
                </div>
            ) : filteredVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-muted/10 rounded-[3rem] border border-dashed border-border/60">
                    <div className="w-20 h-20 rounded-[2rem] bg-background flex items-center justify-center mb-6 shadow-sm border border-border/40 text-muted-foreground/40">
                        <Video className="w-10 h-10" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">Library is empty</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">Save videos while watching to see them appear here for quick access.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredVideos.map((video) => (
                        <div 
                            key={video.id}
                            onClick={() => navigate(`/watch?v=${video.video_id}`)}
                            className="group relative bg-card hover:bg-muted/20 border border-border/60 rounded-[2rem] overflow-hidden transition-all cursor-pointer hover:shadow-2xl hover:border-primary/20 flex flex-col"
                        >
                            <div className="aspect-video relative overflow-hidden">
                                <img 
                                    src={video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`} 
                                    alt={video.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <Play className="w-6 h-6 fill-current" />
                                    </div>
                                </div>
                                <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    className="absolute top-4 right-4 h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90 group-hover:scale-100"
                                    onClick={(e) => handleRemove(video.id, e)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            
                            <div className="p-6 flex-1">
                                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                    {video.title}
                                </h3>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                    Added {new Date(video.created_at).toLocaleDateString()}
                                </p>
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
