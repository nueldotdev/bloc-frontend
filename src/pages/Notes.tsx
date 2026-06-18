import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import api from "@/lib/api"
import { 
  Search, 
  Notebook,
  ExternalLink,
  Clock,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter
} from "lucide-react"
import DashboardLayout from "@/components/app/DashboardLayout"

interface NoteWithContext {
    id: string;
    text: string;
    timestamp: number;
    video_id: string;
    session_id: string;
    created_at: string;
    sessions?: {
        name: string;
        queue: Array<{ id: string; title: string }>;
    };
}

const getNotePreview = (text: string, maxLength: number = 160) => {
  const clean = text
    .replace(/\$\$[\s\S]*?\$\$/g, '') // remove $$ math blocks
    .replace(/\$[\s\S]*?\$/g, '')     // remove $ inline math
    .replace(/#+\s+/g, '')            // remove headers
    .replace(/[*_`~#]/g, '')          // remove formatting symbols
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // simplify markdown links
    .replace(/^-\s+/gm, '')           // list dashes
    .replace(/^\d+\.\s+/gm, '')       // list numbers
    .replace(/>\s+/g, '')             // blockquotes
    .replace(/\s+/g, ' ')             // collapse multiple whitespaces
    .trim();

  const final = clean || text.trim();
  if (final.length <= maxLength) return final;
  return final.slice(0, maxLength) + "...";
}

export default function Notes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notes, setNotes] = useState<NoteWithContext[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSessionId, setSelectedSessionId] = useState<string>("all")
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) {
      navigate("/")
      return
    }

    const loadNotes = async () => {
      try {
        const res = await api.get<{ data: NoteWithContext[] }>("notes")
        setNotes(res.data)
      } catch (error) {
        console.error("Failed to load notes", error)
      } finally {
        setLoading(false)
      }
    }

    loadNotes()
  }, [user, navigate])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this note?")) return
    try {
      await api.delete(`notes/${id}`)
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error("Failed to delete note", error)
    }
  }

  const formatTimestamp = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getVideoTitle = (note: NoteWithContext) => {
    if (note.sessions?.queue) {
        const video = note.sessions.queue.find(v => v.id === note.video_id)
        if (video) return video.title
    }
    return "Unknown Video"
  }

  const jumpToNote = (note: NoteWithContext, e: React.MouseEvent) => {
    e.stopPropagation()
    localStorage.setItem("bloc_active_session_id", note.session_id)
    navigate(`/watch?v=${note.video_id}&t=${Math.floor(note.timestamp)}`)
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedNotes)
    if (newExpanded.has(id)) {
        newExpanded.delete(id)
    } else {
        newExpanded.add(id)
    }
    setExpandedNotes(newExpanded)
  }

  // Get unique sessions for filtering
  const uniqueSessions = Array.from(new Map(
    notes.map(n => [n.session_id, n.sessions?.name || "Unknown Session"])
  ).entries())

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (n.sessions?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        getVideoTitle(n).toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesSession = selectedSessionId === "all" || n.session_id === selectedSessionId
    
    return matchesSearch && matchesSession
  })

  return (
    <DashboardLayout>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight mb-1 text-foreground">Study Notes</h1>
                <p className="text-muted-foreground text-sm font-medium opacity-80">All your insights across all sessions.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
                <div className="relative flex-1 group">
                    <input 
                        placeholder="Search content, videos..."
                        className="w-full pl-12 h-12 rounded-2xl border-2 border-border/60 focus:ring-4 focus:ring-primary/10 transition-all bg-card shadow-sm focus:outline-none focus:border-primary/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>

                <div className="relative min-w-[200px]">
                    <select 
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 rounded-2xl border-2 border-border/60 bg-card shadow-sm focus:ring-4 focus:ring-primary/10 transition-all focus:outline-none appearance-none cursor-pointer font-medium text-sm"
                    >
                        <option value="all">All Sessions</option>
                        {uniqueSessions.map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                        ))}
                    </select>
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
            </div>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 rounded-3xl bg-muted/50 animate-pulse border border-border/40" />
                    ))}
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-muted/10 rounded-[3rem] border border-dashed border-border/60">
                    <div className="w-20 h-20 rounded-[2rem] bg-background flex items-center justify-center mb-6 shadow-sm border border-border/40 text-muted-foreground/40">
                        <Notebook className="w-10 h-10" />
                    </div>
                    <h3 className="font-bold text-xl mb-2 text-foreground">No notes found</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">Try adjusting your search or filter to find what you're looking for.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredNotes.map((note) => {
                        const isExpanded = expandedNotes.has(note.id)
                        return (
                            <div 
                                key={note.id}
                                onClick={() => toggleExpand(note.id)}
                                className="group relative bg-card hover:bg-muted/10 border border-border/60 rounded-[2rem] p-6 transition-all hover:border-primary/40 cursor-pointer shadow-sm hover:shadow-md"
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                                {note.sessions?.name || "No Session"}
                                            </span>
                                            <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(note.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between gap-4">
                                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                {getVideoTitle(note)}
                                            </h3>
                                            {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
                                        </div>
                                        
                                        <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-20 opacity-80'}`}>
                                            {isExpanded ? (
                                                <div className="prose prose-sm prose-invert max-w-none text-muted-foreground text-sm leading-relaxed">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkMath]}
                                                        rehypePlugins={[rehypeKatex]}
                                                    >
                                                        {note.text}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground text-sm leading-relaxed italic">
                                                    "{getNotePreview(note.text, 160)}"
                                                    <span className="ml-2 text-xs text-primary not-italic font-bold group-hover:underline">
                                                        Show more
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg border border-border/50">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatTimestamp(note.timestamp)}
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 text-[11px] font-bold gap-1.5 rounded-lg hover:bg-primary/10 hover:text-primary"
                                                    onClick={(e) => jumpToNote(note, e)}
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    JUMP TO VIDEO
                                                </Button>
                                            </div>

                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                                onClick={(e) => handleDelete(note.id, e)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    </DashboardLayout>
  )
}

