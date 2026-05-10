import { useState, useCallback, useRef, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import Player from "@/components/video/Player"
import type { PlayerHandle } from "@/components/video/Player"
import InteractiveSidebar, { type Note, type ChatMessage, type Session, type Topic } from "@/components/sidebar/InteractiveSidebar"
import QuizOverlay from "@/components/video/QuizOverlay"
import FinalQuizOverlay from "@/components/video/FinalQuizOverlay"
import api from "@/lib/api"
import type { API_Response } from "@/lib/types"
import { useAuth } from "@/components/auth-provider"

interface QueueItem {
    id: string;
    title: string;
}

interface VideoData {
    notes: Note[];
    chats: ChatMessage[];
    topics?: Topic[];
}

interface BlocSession {
    queue: QueueItem[];
    videoData: Record<string, VideoData>;
}

const STORAGE_KEY = "bloc_current_session"

export default function Watchpage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const videoId = searchParams.get("v")
    const playlistId = searchParams.get("list")
    const playerRef = useRef<PlayerHandle>(null)
    // const isInitialLoad = useRef(true)
    const { user, profile } = useAuth()
    
    // UI State
    const [activePanel, setActivePanel] = useState<"chat" | "notes" | "queue" | "topics" | "sessions" | null>(null)
    const [isQuizActive, setIsQuizActive] = useState(false)
    const [isFinalQuizActive, setIsFinalQuizActive] = useState(false)
    const [finalQuizData, setFinalQuizData] = useState<any[]>([])
    const [isGeneratingFinalQuiz, setIsGeneratingFinalQuiz] = useState(false)
    const [notification, setNotification] = useState<string | null>(null)
    const [isGeneratingTopics, setIsGeneratingTopics] = useState(false)
    const [isAiLoading, setIsAiLoading] = useState(false)
    
    // Core Session State
    const [queue, setQueue] = useState<QueueItem[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                return JSON.parse(saved).queue || []
            } catch (e) { return [] }
        }
        return []
    })
    
    const [videoDataMap, setVideoDataMap] = useState<Record<string, VideoData>>(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                return JSON.parse(saved).videoData || {}
            } catch (e) { return {} }
        }
        return {}
    })

    // Auth Sessions State
    const [sessions, setSessions] = useState<Session[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
        return localStorage.getItem("bloc_active_session_id") || ""
    })
    
    // Player status
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [videoTranscript, setVideoTranscript] = useState("")
    const [libraryStatus, setLibraryStatus] = useState<{ isSaved: boolean, id?: string }>({ isSaved: false })

    // Check library status
    useEffect(() => {
        const checkStatus = async () => {
            if (videoId && user) {
                try {
                    const res = await api.get<{ isSaved: boolean, id?: string }>(`library/status/${videoId}`)
                    setLibraryStatus(res)
                } catch (e) {
                    console.error("Failed to check library status", e)
                }
            } else {
                setLibraryStatus({ isSaved: false })
            }
        }
        checkStatus()
    }, [videoId, user])

    // Save Session on Change (Local only)
    useEffect(() => {
        if (!user) {
            const session: BlocSession = {
                queue,
                videoData: videoDataMap
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
        }
    }, [queue, videoDataMap, user])

    // Load Sessions from server
    useEffect(() => {
        const loadSessions = async () => {
            if (user) {
                try {
                    const res = await api.get<{ data: Session[] }>("sessions")
                    setSessions(res.data)
                    if (res.data.length > 0 && !currentSessionId) {
                        const firstSessionId = res.data[0].id
                        setCurrentSessionId(firstSessionId)
                        localStorage.setItem("bloc_active_session_id", firstSessionId)
                    }
                } catch (error) {
                    console.error("Failed to load sessions", error)
                }
            }
        }
        loadSessions()
    }, [user, currentSessionId])

    // Load data from server if logged in
    useEffect(() => {
        const loadServerData = async () => {
            if (user && videoId && currentSessionId) {
                try {
                    const [notesRes, chatRes] = await Promise.all([
                        api.get<{ data: Note[] }>(`notes/${videoId}?sessionId=${currentSessionId}`),
                        api.get<{ data: any[] }>(`gemini/history/${videoId}?sessionId=${currentSessionId}`)
                    ])
                    
                    const chats: ChatMessage[] = chatRes.data.map((c: any) => ({
                        id: c.id,
                        role: c.role,
                        text: c.text,
                        timestamp: c.timestamp
                    }))

                    setVideoDataMap(prev => ({
                        ...prev,
                        [videoId]: { 
                            ...prev[videoId],
                            notes: notesRes.data || [], 
                            chats: chats || [] 
                        }
                    }))
                } catch (error) {
                    console.error("Failed to load server data", error)
                }
            }
        }
        loadServerData()
    }, [user, videoId, currentSessionId])

    const lastSyncedQueueRef = useRef<string>("")

    // Sync queue to server when it changes
    useEffect(() => {
        const sync = async () => {
            if (user && currentSessionId) {
                const queueStr = JSON.stringify(queue)
                if (queueStr !== lastSyncedQueueRef.current) {
                    try {
                        await api.put(`sessions/${currentSessionId}`, { queue })
                        lastSyncedQueueRef.current = queueStr
                    } catch (error) {
                        console.error("Failed to sync queue to server", error)
                    }
                }
            }
        }
        
        // Debounce sync slightly to handle rapid updates
        const timeout = setTimeout(sync, 1000)
        return () => clearTimeout(timeout)
    }, [queue, user, currentSessionId])

    // Load session details (including queue)
    useEffect(() => {
        const loadSessionDetails = async () => {
            if (user && currentSessionId) {
                try {
                    const res = await api.get<{ data: any[] }>("sessions")
                    const current = res.data.find(s => s.id === currentSessionId)
                    if (current && current.queue) {
                        const queueStr = JSON.stringify(current.queue)
                        lastSyncedQueueRef.current = queueStr
                        setQueue(current.queue)
                    }
                } catch (error) {
                    console.error("Failed to load session details", error)
                }
            }
        }
        loadSessionDetails()
    }, [user, currentSessionId])

    // Fetch Topics if missing
    useEffect(() => {
        const generateTopics = async () => {
            if (user && videoId && videoTranscript && !videoDataMap[videoId]?.topics && !isGeneratingTopics) {
                setIsGeneratingTopics(true)
                try {
                    const res = await api.post<{ data: Topic[] }>("gemini/topics", { videoId, videoTranscript })
                    setVideoDataMap(prev => ({
                        ...prev,
                        [videoId]: {
                            ...prev[videoId],
                            topics: res.data
                        }
                    }))
                } catch (error) {
                    console.error("Failed to generate topics", error)
                } finally {
                    setIsGeneratingTopics(false)
                }
            }
        }
        generateTopics()
    }, [user, videoId, videoTranscript, videoDataMap, isGeneratingTopics])

    // Dynamic Sanity check timer (Auth only)
    useEffect(() => {
        if (!user || !videoId || duration <= 0) return;
        if (profile?.sanity_checks_enabled === false) return;

        let intervalSeconds = 8 * 60;
        if (duration < 300) intervalSeconds = 90;
        else if (duration < 1200) intervalSeconds = 240;

        const mins = (intervalSeconds / 60).toFixed(1)
        const timer = setTimeout(() => {
            setNotification(`Sanity check scheduled every ${mins} minutes.`)
            setTimeout(() => setNotification(null), 5000)
        }, 100)

        const interval = setInterval(() => {
            if (videoId) {
                setIsQuizActive(prev => {
                    if (prev) return prev
                    playerRef.current?.pauseVideo()
                    return true
                })
            }
        }, intervalSeconds * 1000) 

        return () => {
            clearInterval(interval)
            clearTimeout(timer)
        }
    }, [videoId, duration, user, profile])

    const fetchTitle = async (id: string) => {
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
            const data = await response.json()
            return data.title || id
        } catch (e) {
            return id
        }
    }

    const fetchTranscript = async (id: string) => {
        try {
            const transcript = await api.get<API_Response>(`transcripts/${id}`);
            return transcript.data.text;
        } catch (e) {
            console.error("Failed to fetch transcript", id, e);
            return "";
        }
    }

    // Initialize current video
    useEffect(() => {
        const init = async () => {
            if (videoId) {
                // Ensure video is in queue
                if (!queue.find(item => item.id === videoId)) {
                    const title = await fetchTitle(videoId)
                    setQueue(prev => prev.find(i => i.id === videoId) ? prev : [...prev, { id: videoId, title }])
                }
                
                const transcript = await fetchTranscript(videoId)
                setVideoTranscript(transcript)

                if (!videoDataMap[videoId] && !user) {
                    setVideoDataMap(prev => ({
                        ...prev,
                        [videoId]: { notes: [], chats: [] }
                    }))
                }
            }
        }
        init()
    }, [videoId, user, queue, videoDataMap])

    const handlePlaylistLoaded = useCallback(async (ids: string[]) => {
        const newIds = ids.filter(id => !queue.find(item => item.id === id))
        if (newIds.length === 0) return
        const newItems: QueueItem[] = newIds.map(id => ({ id, title: `Loading title (${id})...` }))
        setQueue(prev => [...prev, ...newItems])
        for (const item of newItems) {
            const title = await fetchTitle(item.id)
            setQueue(currentQueue => 
                currentQueue.map(q => q.id === item.id ? { ...q, title } : q)
            )
        }
    }, [queue])

    const handleProgress = useCallback((time: number) => {
        setCurrentTime(time)
    }, [])

    const handleTimestampClick = useCallback((seconds: number) => {
        playerRef.current?.seekTo(seconds)
    }, [])

    const handleAddToQueue = useCallback(async (id: string, title: string) => {
        setQueue(prev => [...prev, { id, title }])
    }, [])

    const handlePlayFromQueue = useCallback((id: string) => {
        setSearchParams({ v: id, list: playlistId || "" })
    }, [setSearchParams, playlistId])

    const handleRemoveFromQueue = useCallback((id: string) => {
        setQueue(prev => prev.filter(item => item.id !== id))
    }, [])

    const handleNextVideo = useCallback(() => {
        if (!videoId) return
        const currentIndex = queue.findIndex(i => i.id === videoId)
        if (currentIndex !== -1 && currentIndex < queue.length - 1) {
            handlePlayFromQueue(queue[currentIndex + 1].id)
        }
    }, [videoId, queue, handlePlayFromQueue])

    const handleReplay = useCallback(() => {
        setIsFinalQuizActive(false)
        playerRef.current?.seekTo(0)
        playerRef.current?.playVideo()
    }, [])

    const handleVideoEnded = useCallback(async () => {
        playerRef.current?.pauseVideo() // STOP IMMEDIATELY
        console.log("[Watchpage] handleVideoEnded triggered - Player paused")
        
        console.log("[Watchpage] Current videoId:", videoId)
        console.log("[Watchpage] User logged in:", !!user)
        console.log("[Watchpage] Transcript length:", videoTranscript?.length || 0)

        if (!user || !videoId || !videoTranscript || videoTranscript.length < 100) {
            console.log("[Watchpage] Missing requirements for final quiz, skipping...")
            handleNextVideo()
            return
        }

        setIsGeneratingFinalQuiz(true)
        playerRef.current?.pauseVideo() // Ensure video is paused during generation
        
        try {
            const currentVideo = queue.find(q => q.id === videoId)
            const payload = {
                videoId,
                videoTranscript,
                videoTitle: currentVideo?.title || "Unknown Video"
            }
            
            console.log("[Watchpage] Requesting final quiz from backend...")
            
            const res = await api.post<{ data: any[] }>("gemini/final-quiz", payload)
            
            console.log("[Watchpage] Final quiz generated successfully:", res.data)
            setFinalQuizData(res.data)
            setIsFinalQuizActive(true)
            playerRef.current?.pauseVideo() // Extra safety to keep it paused
        } catch (error: any) {
            console.error("[Watchpage] Final quiz generation failed:", error)
            setNotification(`Failed to generate quiz: ${error.message || "Unknown error"}`)
            setTimeout(() => setNotification(null), 5000)
            handleNextVideo()
        } finally {
            setIsGeneratingFinalQuiz(false)
        }
    }, [user, videoId, videoTranscript, queue, handleNextVideo])

    const handleAddNote = useCallback(async (text: string) => {
        if (!videoId) return
        
        if (user && currentSessionId) {
            try {
                const res = await api.post<{ data: Note }>("notes", {
                    videoId,
                    text,
                    timestamp: currentTime,
                    sessionId: currentSessionId
                })
                setVideoDataMap(prev => ({
                    ...prev,
                    [videoId]: {
                        ...prev[videoId],
                        notes: [res.data, ...(prev[videoId]?.notes || [])]
                    }
                }))
            } catch (error) {
                console.error("Failed to save note to server", error)
            }
        } else {
            const newNote: Note = {
                id: Date.now().toString(),
                timestamp: currentTime,
                text
            }
            setVideoDataMap(prev => ({
                ...prev,
                [videoId]: {
                    ...prev[videoId],
                    notes: [newNote, ...(prev[videoId]?.notes || [])]
                }
            }))
        }
    }, [videoId, currentTime, user, currentSessionId])

    const handleEditNote = useCallback(async (id: string, text: string) => {
        if (!videoId) return
        if (user) {
            try {
                const res = await api.put<{ data: Note }>(`notes/${id}`, { text })
                setVideoDataMap(prev => ({
                    ...prev,
                    [videoId]: {
                        ...prev[videoId],
                        notes: prev[videoId].notes.map(n => n.id === id ? res.data : n)
                    }
                }))
            } catch (error) {
                console.error("Failed to edit note", error)
            }
        } else {
            setVideoDataMap(prev => ({
                ...prev,
                [videoId]: {
                    ...prev[videoId],
                    notes: prev[videoId].notes.map(n => n.id === id ? { ...n, text } : n)
                }
            }))
        }
    }, [user, videoId])

    const handleDeleteNote = useCallback(async (id: string) => {
        if (!videoId) return
        if (user) {
            try {
                await api.delete(`notes/${id}`)
                setVideoDataMap(prev => ({
                    ...prev,
                    [videoId]: {
                        ...prev[videoId],
                        notes: prev[videoId].notes.filter(n => n.id !== id)
                    }
                }))
            } catch (error) {
                console.error("Failed to delete note", error)
            }
        } else {
            setVideoDataMap(prev => ({
                ...prev,
                [videoId]: {
                    ...prev[videoId],
                    notes: prev[videoId].notes.filter(n => n.id !== id)
                }
            }))
        }
    }, [user, videoId])

    const handleSendMessage = useCallback(async (text: string) => {
        if (!videoId) return

        if (!user) {
            setNotification("AI features are available for logged-in students only!")
            setTimeout(() => setNotification(null), 3000)
            return
        }

        if (!currentSessionId) {
            setNotification("Please select or create a session first!")
            setTimeout(() => setNotification(null), 3000)
            setActivePanel("sessions")
            return
        }

        // Switch to chat panel so user sees the message being sent and the response
        setActivePanel("chat")
        
        const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", text, timestamp: currentTime }
        
        // Add user message immediately
        setVideoDataMap(prev => ({
            ...prev,
            [videoId]: {
                ...prev[videoId],
                chats: [...(prev[videoId]?.chats || []), userMsg]
            }
        }))

        try {
            const currentVideo = queue.find(q => q.id === videoId)
            const videoTitle = currentVideo?.title || "Unknown Video"
            
            // Format history for Gemini
            const history = (videoDataMap[videoId]?.chats || []).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }))

            setIsAiLoading(true)
            const res = await api.post<{ text: string }>("gemini/chat", {
                message: text,
                history,
                videoId,
                videoTranscript,
                timestamp: currentTime,
                videoTitle,
                sessionId: currentSessionId
            })

            const aiMsg: ChatMessage = { 
                id: Date.now().toString(), 
                role: "ai", 
                text: res.text,
                timestamp: currentTime 
            }
            
            setVideoDataMap(prev => ({
                ...prev,
                [videoId]: {
                    ...prev[videoId],
                    chats: [...(prev[videoId]?.chats || []), aiMsg]
                }
            }))
        } catch (error) {
            console.error("Gemini Error:", error)
            const errorMsg: ChatMessage = { 
                id: Date.now().toString(), 
                role: "ai", 
                text: "Sorry, I encountered an error. Please make sure you are logged in correctly!",
            }
            setVideoDataMap(prev => ({
                ...prev,
                [videoId]: {
                    ...prev[videoId],
                    chats: [...(prev[videoId]?.chats || []), errorMsg]
                }
            }))
        } finally {
            setIsAiLoading(false)
        }
    }, [videoId, currentTime, queue, videoDataMap, videoTranscript, user, currentSessionId])

    const handleQuizCorrect = () => {
        setIsQuizActive(false)
        playerRef.current?.playVideo()
    }

    const triggerQuizManual = () => {
        if (!user) {
            setNotification("Sanity checks are for logged-in students only!")
            setTimeout(() => setNotification(null), 3000)
            return
        }
        setIsQuizActive(true);
        playerRef.current?.pauseVideo();
    }

    const handleCreateSession = async (name: string, description?: string, coverUrl?: string) => {
        try {
            const res = await api.post<{ data: Session }>("sessions", { 
                name,
                description,
                coverUrl
            })
            setSessions(prev => [res.data, ...prev])
            setCurrentSessionId(res.data.id)
            localStorage.setItem("bloc_active_session_id", res.data.id)
        } catch (error) {
            console.error("Failed to create session", error)
        }
    }

    const handleSwitchSession = (id: string) => {
        setCurrentSessionId(id)
        localStorage.setItem("bloc_active_session_id", id)
    }

    const handleUpdateSession = async (id: string, name: string, description?: string, coverUrl?: string) => {
        try {
            const res = await api.put<{ data: Session }>(`sessions/${id}`, { 
                name,
                description,
                coverUrl
            })
            setSessions(prev => prev.map(s => s.id === id ? res.data : s))
        } catch (error) {
            console.error("Failed to update session", error)
        }
    }

    const handleDeleteSession = async (id: string) => {
        try {
            await api.delete(`sessions/${id}`)
            setSessions(prev => prev.filter(s => s.id !== id))
            if (currentSessionId === id) {
                setCurrentSessionId("")
                localStorage.removeItem("bloc_active_session_id")
            }
        } catch (error) {
            console.error("Failed to delete session", error)
        }
    }

    const handleToggleLibrary = async () => {
        if (!user) {
            setNotification("Please log in to save videos to your library!")
            setTimeout(() => setNotification(null), 3000)
            return
        }

        if (!videoId) return

        try {
            if (libraryStatus.isSaved && libraryStatus.id) {
                await api.delete(`library/${libraryStatus.id}`)
                setLibraryStatus({ isSaved: false })
                setNotification("Removed from library")
            } else {
                const title = await fetchTitle(videoId)
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                const res = await api.post<{ data: any }>("library", {
                    videoId,
                    title,
                    thumbnailUrl
                })
                setLibraryStatus({ isSaved: true, id: res.data.id })
                setNotification("Saved to library!")
            }
            setTimeout(() => setNotification(null), 2000)
        } catch (error) {
            console.error("Library action failed", error)
        }
    }

    const handleVideoChange = useCallback((newId: string) => {
        if (newId && newId !== videoId) {
            setSearchParams({ v: newId, list: playlistId || "" })
        }
    }, [videoId, playlistId, setSearchParams])

    const currentVideoData = videoId ? videoDataMap[videoId] : null

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
            {/* Main Video Area */}
            <div className="flex-1 relative bg-black/95 flex flex-col items-center">
                {videoId || playlistId ? (
                    <Player 
                        ref={playerRef}
                        videoId={videoId || ""} 
                        playlistId={playlistId || ""}
                        onProgress={handleProgress}
                        onDuration={setDuration}
                        onEnded={handleVideoEnded}
                        onPlaylistLoaded={handlePlaylistLoaded}
                        onVideoChange={handleVideoChange}
                    />
                ) : (
                    <div className="flex w-full h-full justify-center items-center text-white">
                        <p>No video or playlist provided.</p>
                    </div>
                )}

                {isQuizActive && <QuizOverlay onCorrect={handleQuizCorrect} />}
                {isFinalQuizActive && (
                    <FinalQuizOverlay 
                        quizData={finalQuizData} 
                        onClose={() => {
                            setIsFinalQuizActive(false)
                            handleNextVideo()
                        }} 
                        onReplay={handleReplay}
                    />
                )}
                
                {isGeneratingFinalQuiz && (
                    <div className="absolute inset-0 z-100 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
                         <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
                         <h3 className="text-xl font-bold">Generating Final Assessment...</h3>
                         <p className="text-muted-foreground text-sm">Gemini is analyzing your session to create a custom quiz.</p>
                    </div>
                )}
                
                {notification && !isQuizActive && !isFinalQuizActive && !isGeneratingFinalQuiz && (
                    <div className="absolute top-8 z-60 bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 fade-in duration-500">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <p className="text-sm font-medium text-white/90">{notification}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar Region */}
            <div className="flex h-full bg-card">
                <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden flex ${
                        activePanel ? "w-[400px] border-l border-border" : "w-0"
                    }`}
                >
                    <div className="w-[400px] min-w-[400px] h-full flex flex-col pt-4">
                         <InteractiveSidebar 
                            activePanel={activePanel} 
                            currentTime={currentTime} 
                            onTimestampClick={handleTimestampClick}
                            queue={queue}
                            currentVideoId={videoId || ""}
                            onAddToQueue={handleAddToQueue}
                            onPlayFromQueue={handlePlayFromQueue}
                            onRemoveFromQueue={handleRemoveFromQueue}
                            onTriggerQuizManual={triggerQuizManual}
                            notes={currentVideoData?.notes || []}
                            chatHistory={currentVideoData?.chats || []}
                            onAddNote={handleAddNote}
                            onEditNote={handleEditNote}
                            onDeleteNote={handleDeleteNote}
                            onSendMessage={handleSendMessage}
                            topics={currentVideoData?.topics || []}
                            sessions={sessions}
                            currentSessionId={currentSessionId}
                            onSwitchSession={handleSwitchSession}
                            onCreateSession={handleCreateSession}
                            onUpdateSession={handleUpdateSession}
                            onDeleteSession={handleDeleteSession}
                            isGeneratingTopics={isGeneratingTopics}
                            isAiLoading={isAiLoading}
                        />
                    </div>
                </div>

                {/* Fixed Right Sidenav */}
                <div className="w-16 h-full bg-sidebar flex flex-col items-center py-4 space-y-4 border-l border-border">
                    <button 
                        onClick={() => setActivePanel(activePanel === "chat" ? null : "chat")}
                        className={`p-3 rounded-xl transition-colors ${activePanel === "chat" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-sidebar-foreground"}`}
                        title="AI Chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                    </button>

                    <button 
                        onClick={() => setActivePanel(activePanel === "notes" ? null : "notes")}
                        className={`p-3 rounded-xl transition-colors ${activePanel === "notes" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-sidebar-foreground"}`}
                        title="Notes"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><path d="M9 7h1"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>                    
                    </button>

                    <button 
                        onClick={() => setActivePanel(activePanel === "topics" ? null : "topics")}
                        className={`p-3 rounded-xl transition-colors ${activePanel === "topics" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-sidebar-foreground"}`}
                        title="Topics"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
                    </button>

                    {/* <button 
                        onClick={() => setActivePanel(activePanel === "sessions" ? null : "sessions")}
                        className={`p-3 rounded-xl transition-colors ${activePanel === "sessions" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-sidebar-foreground"}`}
                        title="Sessions"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9l-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>
                    </button> */}

                    <button 
                        onClick={() => setActivePanel(activePanel === "queue" ? null : "queue")}
                        className={`p-3 rounded-xl transition-colors ${activePanel === "queue" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-sidebar-foreground"}`}
                        title="Queue"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
                    </button>

                    <button 
                        onClick={handleToggleLibrary}
                        className={`p-3 rounded-xl transition-all ${libraryStatus.isSaved ? "bg-primary text-primary-foreground" : "hover:bg-accent text-sidebar-foreground"}`}
                        title={libraryStatus.isSaved ? "Saved to Library" : "Save to Library"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={libraryStatus.isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                    </button>

                    <div className="mt-auto pb-4 flex flex-col gap-4">
                         <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-3 rounded-xl hover:bg-accent text-sidebar-foreground"
                            title="Dashboard"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                        </button>
                         <button 
                            onClick={() => navigate('/')}
                            className="p-3 rounded-xl hover:bg-accent text-sidebar-foreground"
                            title="Back to Landing"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
