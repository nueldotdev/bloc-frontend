import { useState, useCallback, useRef, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import Player from "@/components/video/Player"
import type { PlayerHandle } from "@/components/video/Player"
import InteractiveSidebar, { type Note, type ChatMessage } from "@/components/sidebar/InteractiveSidebar"
import QuizOverlay from "@/components/video/QuizOverlay"
import { getGeminiResponse } from "@/lib/gemini"

interface QueueItem {
    id: string;
    title: string;
}

interface VideoData {
    notes: Note[];
    chats: ChatMessage[];
}

interface BlocSession {
    queue: QueueItem[];
    videoData: Record<string, VideoData>;
}

const STORAGE_KEY = "bloc_current_session"

export default function Watchpage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const videoId = searchParams.get("v")
    const playlistId = searchParams.get("list")
    const playerRef = useRef<PlayerHandle>(null)
    const isInitialLoad = useRef(true)
    
    // UI State
    const [activePanel, setActivePanel] = useState<"chat" | "notes" | "queue" | null>(null)
    const [isQuizActive, setIsQuizActive] = useState(false)
    const [notification, setNotification] = useState<string | null>(null)
    
    // Core Session State - Initialize directly from localStorage to prevent overwrite
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
    
    // Player status
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)

    // Save Session on Change
    useEffect(() => {
        // Skip the very first run since we initialized from storage
        if (isInitialLoad.current) {
            isInitialLoad.current = false
            return
        }

        const session: BlocSession = {
            queue,
            videoData: videoDataMap
        }
        console.log("[Watchpage] Saving session to localStorage", session)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    }, [queue, videoDataMap])

    // Dynamic Sanity check timer
    useEffect(() => {
        if (!videoId || duration <= 0) return;
        let intervalSeconds = 8 * 60;
        if (duration < 300) intervalSeconds = 90;
        else if (duration < 1200) intervalSeconds = 240;

        const mins = (intervalSeconds / 60).toFixed(1)
        setNotification(`Sanity check scheduled every ${mins} minutes.`)
        const timer = setTimeout(() => setNotification(null), 5000)

        const interval = setInterval(() => {
            if (videoId && !isQuizActive) {
                setIsQuizActive(true)
                playerRef.current?.pauseVideo()
            }
        }, intervalSeconds * 1000) 

        return () => {
            clearInterval(interval)
            clearTimeout(timer)
        }
    }, [videoId, isQuizActive, duration])

    const fetchTitle = async (id: string) => {
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
            const data = await response.json()
            return data.title || id
        } catch (e) {
            return id
        }
    }

    // Initialize current video in session
    useEffect(() => {
        const init = async () => {
            if (videoId) {
                // Ensure video is in queue
                if (!queue.find(item => item.id === videoId)) {
                    const title = await fetchTitle(videoId)
                    setQueue(prev => prev.find(i => i.id === videoId) ? prev : [...prev, { id: videoId, title }])
                }
                // Ensure video data entry exists
                if (!videoDataMap[videoId]) {
                    setVideoDataMap(prev => ({
                        ...prev,
                        [videoId]: { notes: [], chats: [] }
                    }))
                }
            }
        }
        init()
    }, [videoId])

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

    const handleNextVideo = useCallback(() => {
        if (!videoId) return
        const currentIndex = queue.findIndex(i => i.id === videoId)
        if (currentIndex !== -1 && currentIndex < queue.length - 1) {
            handlePlayFromQueue(queue[currentIndex + 1].id)
        }
    }, [videoId, queue, handlePlayFromQueue])

    const handleAddNote = useCallback((text: string) => {
        if (!videoId) return
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
    }, [videoId, currentTime])

    const handleSendMessage = useCallback(async (text: string) => {
        if (!videoId) return
        
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

            const contextText = `The user is watching a video titled "${videoTitle}" at the timestamp ${Math.floor(currentTime)} seconds.`
            const aiResponse = await getGeminiResponse(`${contextText}\n\n${text}`, history)

            const aiMsg: ChatMessage = { 
                id: Date.now().toString(), 
                role: "ai", 
                text: aiResponse,
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
                text: "Sorry, I encountered an error connecting to my brain. Please check your API key!",
            }
            setVideoDataMap(prev => ({
                ...prev,
                [videoId]: {
                    ...prev[videoId],
                    chats: [...(prev[videoId]?.chats || []), errorMsg]
                }
            }))
        }
    }, [videoId, currentTime, queue, videoDataMap])

    const handleQuizCorrect = () => {
        setIsQuizActive(false)
        playerRef.current?.playVideo()
    }

    const triggerQuizManual = () => {
        setIsQuizActive(true);
        playerRef.current?.pauseVideo();
    }

    const currentVideoData = videoId ? videoDataMap[videoId] : null

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
            {/* Main Video Area */}
            <div className="flex-1 relative bg-black/95 flex flex-col items-center">
                {isQuizActive && <QuizOverlay onCorrect={handleQuizCorrect} />}
                
                {notification && !isQuizActive && (
                    <div className="absolute top-8 z-[60] bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 fade-in duration-500">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <p className="text-sm font-medium text-white/90">{notification}</p>
                        </div>
                    </div>
                )}
                
                {videoId || playlistId ? (
                    <Player 
                        ref={playerRef}
                        videoId={videoId || ""} 
                        playlistId={playlistId || ""}
                        onProgress={handleProgress}
                        onDuration={setDuration}
                        onEnded={handleNextVideo}
                        onPlaylistLoaded={handlePlaylistLoaded}
                    />
                ) : (
                    <div className="flex w-full h-full justify-center items-center text-white">
                        <p>No video or playlist provided.</p>
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
                            onTriggerQuizManual={triggerQuizManual}
                            notes={currentVideoData?.notes || []}
                            chatHistory={currentVideoData?.chats || []}
                            onAddNote={handleAddNote}
                            onSendMessage={handleSendMessage}
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
                        onClick={() => setActivePanel(activePanel === "queue" ? null : "queue")}
                        className={`p-3 rounded-xl transition-colors ${activePanel === "queue" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-sidebar-foreground"}`}
                        title="Queue"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
