import { useState } from "react"
import ReactMarkdown from "react-markdown"

export interface Note {
    id: string;
    timestamp: number;
    text: string;
}

export interface ChatMessage {
    id: string;
    role: "user" | "ai";
    text: string;
    timestamp?: number;
}

interface QueueItem {
    id: string;
    title: string;
}

export default function InteractiveSidebar({ 
    activePanel, 
    currentTime,
    onTimestampClick,
    queue = [],
    currentVideoId = "",
    onAddToQueue,
    onPlayFromQueue,
    onTriggerQuizManual,
    notes = [],
    chatHistory = [],
    onAddNote,
    onSendMessage
}: { 
    activePanel: "chat" | "notes" | "queue" | null, 
    currentTime: number,
    onTimestampClick: (seconds: number) => void,
    queue?: QueueItem[],
    currentVideoId?: string,
    onAddToQueue?: (id: string, title: string) => void,
    onPlayFromQueue?: (id: string) => void,
    onTriggerQuizManual?: () => void,
    notes?: Note[],
    chatHistory?: ChatMessage[],
    onAddNote: (text: string) => void,
    onSendMessage: (text: string) => void
}) {
    const [inputText, setInputText] = useState("")
    const [queueInput, setQueueInput] = useState("")
    const [chatInput, setChatInput] = useState("")
    const [isFetching, setIsFetching] = useState(false)

    const formatTimestamp = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = Math.floor(seconds % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    const fetchVideoTitle = async (id: string) => {
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
            const data = await response.json()
            return data.title || id
        } catch (e) {
            return id
        }
    }

    const handleAddNote = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!inputText.trim()) return
        onAddNote(inputText.trim())
        setInputText("")
    }

    const handleAddQueue = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!queueInput.trim() || isFetching) return
        
        setIsFetching(true)
        let id = queueInput.trim()
        try {
            const url = new URL(id)
            if (url.hostname.includes("youtube.com")) {
                id = url.searchParams.get("v") || id
            } else if (url.hostname.includes("youtu.be")) {
                id = url.pathname.slice(1)
            }
        } catch (e) {}

        const title = await fetchVideoTitle(id)
        if (id && onAddToQueue) {
            onAddToQueue(id, title)
            setQueueInput("")
        }
        setIsFetching(false)
    }

    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault()
        if (!chatInput.trim()) return
        onSendMessage(chatInput.trim())
        setChatInput("")
    }

    if (activePanel === "chat") {
        return (
            <div className="flex flex-col h-full w-full px-6 pb-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                        </div>
                        AI Assistant
                    </h2>
                    <button 
                        onClick={onTriggerQuizManual}
                        className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground hover:text-primary transition-colors border border-border px-2 py-1 rounded-md"
                    >
                        Debug: Trigger Quiz
                    </button>
                </div>
                
                <div className="flex-1 bg-muted/40 rounded-2xl border border-border p-5 overflow-y-auto space-y-4 mb-4">
                    {chatHistory.length === 0 && (
                         <div className="bg-background border border-border text-foreground p-4 rounded-2xl rounded-tl-sm text-sm shadow-sm leading-relaxed">
                            Hello! I am your AI learning assistant. I understand you're at <button onClick={() => onTimestampClick(currentTime)} className="text-primary font-mono hover:underline">{formatTimestamp(currentTime)}</button>. How can I help?
                        </div>
                    )}
                    {chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[90%] p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                                : 'bg-background border border-border text-foreground rounded-tl-sm'
                            }`}>
                                {msg.role === 'ai' ? (
                                    <div className="prose prose-sm prose-invert max-w-none">
                                        <ReactMarkdown 
                                            components={{
                                                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                                ul: ({children}) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                                                ol: ({children}) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                                                code: ({children}) => <code className="bg-muted px-1 rounded font-mono text-[12px]">{children}</code>
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    msg.text
                                )}
                                {msg.timestamp !== undefined && (
                                    <button 
                                        onClick={() => onTimestampClick(msg.timestamp!)}
                                        className={`block mt-2 font-mono text-[10px] opacity-70 hover:opacity-100 underline`}
                                    >
                                        @{formatTimestamp(msg.timestamp)}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSendChat} className="flex gap-3">
                    <input 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-1 h-12 w-full rounded-xl border border-input bg-background/50 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                        placeholder="Ask a question..."
                    />
                    <button className="inline-flex items-center justify-center rounded-xl font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-12 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    </button>
                </form>
            </div>
        )
    }

    if (activePanel === "notes") {
        return (
            <div className="flex flex-col h-full w-full px-6 pb-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><path d="M9 7h1"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>                    
                        </div>
                        Study Notes
                    </h2>
                    <button 
                        onClick={onTriggerQuizManual}
                        className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground hover:text-primary transition-colors border border-border px-2 py-1 rounded-md"
                    >
                        Debug: Trigger Quiz
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                    {notes.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/><path d="M9 18h6"/></svg>
                            <p className="text-sm">No notes yet. Type below to capture a moment!</p>
                        </div>
                    ) : (
                        notes.map(note => (
                            <div key={note.id} className="group flex items-start gap-3 bg-muted/30 p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                                <button 
                                    onClick={() => onTimestampClick(note.timestamp)}
                                    className="shrink-0 font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                                >
                                    {formatTimestamp(note.timestamp)}
                                </button>
                                <p className="text-sm leading-relaxed text-foreground/90 break-words flex-1">
                                    {note.text}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2">
                    <input 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 h-12 rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                        placeholder="Add a note at this time..."
                    />
                    <button 
                        type="submit"
                        className="inline-flex items-center justify-center rounded-xl font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-12 shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    </button>
                </form>
            </div>
        )
    }

    if (activePanel === "queue") {
        return (
            <div className="flex flex-col h-full w-full px-6 pb-6 animate-in fade-in duration-500">
                <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
                    </div>
                    Up Next
                </h2>

                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                    {queue.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                             <p className="text-sm">Your queue is empty.</p>
                        </div>
                    ) : (
                        queue.map((item, index) => (
                            <div 
                                key={index} 
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                    item.id === currentVideoId 
                                    ? "bg-primary/10 border-primary/30" 
                                    : "bg-muted/20 border-border/50 hover:bg-muted/40"
                                }`}
                            >
                                <div className="text-xs font-bold text-muted-foreground w-4">{index + 1}</div>
                                <div className="flex-1 truncate text-sm font-medium pr-2">
                                    {item.title}
                                </div>
                                <button 
                                    onClick={() => onPlayFromQueue?.(item.id)}
                                    className="p-2 hover:bg-background rounded-lg text-primary transition-colors shrink-0"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={handleAddQueue} className="flex gap-2">
                    <input 
                        value={queueInput}
                        onChange={(e) => setQueueInput(e.target.value)}
                        className="flex-1 h-12 rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm disabled:opacity-50"
                        placeholder={isFetching ? "Fetching title..." : "Paste YouTube URL to queue..."}
                        disabled={isFetching}
                    />
                    <button 
                        type="submit"
                        disabled={isFetching}
                        className="inline-flex items-center justify-center rounded-xl font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-12 shadow-sm disabled:opacity-50"
                    >
                        {isFetching ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>
                        )}
                    </button>
                </form>
            </div>
        )
    }

    return null
}
