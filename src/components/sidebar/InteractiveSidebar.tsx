import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import {
	Trash2,
	Edit3,
	Check,
	X,
	Play,
	Plus
} from "lucide-react"
import { Button } from "../ui/button"

export interface Note {
	id: string;
	timestamp: number;
	text: string;
	sessionId?: string;
}

export interface ChatMessage {
	id: string;
	role: "user" | "ai";
	text: string;
	timestamp?: number;
	sessionId?: string;
}

export type Topic = string;

export interface Session {
	id: string;
	name: string;
	created_at: string;
	initial_url?: string;
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
	onRemoveFromQueue,
	onTriggerQuizManual,
	notes = [],
	chatHistory = [],
	onAddNote,
	onEditNote,
	onDeleteNote,
	onSendMessage,
	topics = [],
	sessions = [],
	currentSessionId = "",
	onSwitchSession,
	onCreateSession,
	onUpdateSession,
	onDeleteSession,
	isGeneratingTopics = false,
	isAiLoading = false
}: {
	activePanel: "chat" | "notes" | "queue" | "topics" | "sessions" | null,
	currentTime: number,
	onTimestampClick: (seconds: number) => void,
	queue?: QueueItem[],
	currentVideoId?: string,
	onAddToQueue?: (id: string, title: string) => void,
	onPlayFromQueue?: (id: string) => void,
	onRemoveFromQueue?: (id: string) => void,
	onTriggerQuizManual?: () => void,
	notes?: Note[],
	chatHistory?: ChatMessage[],
	onAddNote: (text: string) => void,
	onEditNote?: (id: string, text: string) => void,
	onDeleteNote?: (id: string) => void,
	onSendMessage: (text: string) => void,
	topics?: Topic[],
	sessions?: Session[],
	currentSessionId?: string,
	onSwitchSession?: (id: string) => void,
	onCreateSession?: (name: string) => void,
	onUpdateSession?: (id: string, name: string) => void,
	onDeleteSession?: (id: string) => void,
	isGeneratingTopics?: boolean,
	isAiLoading?: boolean
}) {
	const [inputText, setInputText] = useState("")
	const [queueInput, setQueueInput] = useState("")
	const [chatInput, setChatInput] = useState("")
	const [sessionInput, setSessionInput] = useState("")
	const [isFetching, setIsFetching] = useState(false)

	const chatContainerRef = useRef<HTMLDivElement>(null)

	// Auto-scroll to bottom of chat
	useEffect(() => {
		if (activePanel === "chat" && chatContainerRef.current) {
			chatContainerRef.current.scrollTo({
				top: chatContainerRef.current.scrollHeight,
				behavior: "smooth"
			})
		}
	}, [chatHistory, isAiLoading, activePanel])

	// Inline editing states
	const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
	const [editNoteText, setEditNoteText] = useState("")

	const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
	const [editSessionName, setEditSessionName] = useState("")

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

	const startEditingNote = (note: Note) => {
		setEditingNoteId(note.id)
		setEditNoteText(note.text)
	}

	const saveEditedNote = () => {
		if (editingNoteId && editNoteText.trim() && onEditNote) {
			onEditNote(editingNoteId, editNoteText.trim())
			setEditingNoteId(null)
		}
	}

	const startEditingSession = (session: Session) => {
		setEditingSessionId(session.id)
		setEditSessionName(session.name)
	}

	const saveEditedSession = () => {
		if (editingSessionId && editSessionName.trim() && onUpdateSession) {
			onUpdateSession(editingSessionId, editSessionName.trim())
			setEditingSessionId(null)
		}
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
		} catch (e) { }

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

	const handleCreateSession = (e: React.FormEvent) => {
		e.preventDefault()
		if (!sessionInput.trim() || !onCreateSession) return
		onCreateSession(sessionInput.trim())
		setSessionInput("")
	}

	if (activePanel === "chat") {
		return (
			<div className="flex flex-col h-full w-full px-6 pb-6 animate-in fade-in duration-500">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold text-foreground flex items-center gap-3">
						<div className="p-2 bg-primary/20 rounded-lg text-primary">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
						</div>
						AI Assistant
					</h2>
					<button
						onClick={onTriggerQuizManual}
						className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground hover:text-primary transition-colors border border-border px-2 py-1 rounded-md"
					>
						Trigger Quiz
					</button>
				</div>

				<div
					ref={chatContainerRef}
					className="flex-1 bg-muted/40 rounded-2xl border border-border p-5 overflow-y-auto space-y-4 mb-4"
				>
					{chatHistory.length === 0 && (
						<div className="bg-background border border-border text-foreground p-4 rounded-2xl rounded-tl-sm text-sm shadow-sm leading-relaxed">
							Hello! I am your AI learning assistant. I understand you're at <button onClick={() => onTimestampClick(currentTime)} className="text-primary font-mono hover:underline">{formatTimestamp(currentTime)}</button>. How can I help?
						</div>
					)}
					{chatHistory.map((msg) => (
						<div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
							<div className={`max-w-[90%] p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.role === 'user'
									? 'bg-primary text-primary-foreground rounded-tr-sm'
									: 'bg-background border border-border text-foreground rounded-tl-sm'
								}`}>
								{msg.role === 'ai' ? (
									<div className="prose prose-sm prose-invert max-w-none">
										<ReactMarkdown
											components={{
												p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
												ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
												ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
												code: ({ children }) => <code className="bg-muted px-1 rounded font-mono text-[12px]">{children}</code>
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

					{isAiLoading && (
						<div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
							<div className="bg-background border border-border text-foreground p-4 rounded-2xl rounded-tl-sm shadow-sm">
								<div className="flex gap-1">
									<div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
									<div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
									<div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
								</div>
							</div>
						</div>
					)}
				</div>

				<form onSubmit={handleSendChat} className="flex gap-3">
					<input
						value={chatInput}
						onChange={(e) => setChatInput(e.target.value)}
						className="flex-1 h-12 w-full rounded-xl border border-input bg-background/50 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
						placeholder="Ask a question..."
					/>
					<button className="inline-flex items-center justify-center rounded-xl font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-12 shadow-sm">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
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
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" /><path d="M9 7h1" /><path d="M9 13h6" /><path d="M9 17h6" /></svg>
						</div>
						Study Notes
					</h2>
				</div>

				<div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
					{notes.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
							<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" /><path d="M15 3v6h6" /><path d="M9 18h6" /></svg>
							<p className="text-sm">No notes yet. Type below to capture a moment!</p>
						</div>
					) : (
						notes.map(note => (
							<div key={note.id} className="group relative bg-muted/30 p-4 rounded-2xl border border-border/50 hover:border-primary/30 transition-all">
								{editingNoteId === note.id ? (
									<div className="flex flex-col gap-2">
										<textarea
											value={editNoteText}
											onChange={(e) => setEditNoteText(e.target.value)}
											className="w-full bg-background border border-primary/50 rounded-xl p-3 text-sm focus:outline-none min-h-[80px]"
											autoFocus
										/>
										<div className="flex justify-end gap-2">
											<Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => setEditingNoteId(null)}>
												<X className="w-4 h-4" />
											</Button>
											<Button size="sm" className="h-8 rounded-lg" onClick={saveEditedNote}>
												<Check className="w-4 h-4" />
											</Button>
										</div>
									</div>
								) : (
									<>
										<div className="flex items-center justify-between mb-2">
											<button
												onClick={() => onTimestampClick(note.timestamp)}
												className="font-mono text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary hover:text-primary-foreground transition-colors"
											>
												{formatTimestamp(note.timestamp)}
											</button>
											<div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
												<button onClick={() => startEditingNote(note)} className="p-1 hover:text-primary transition-colors">
													<Edit3 className="w-3.5 h-3.5" />
												</button>
												<button onClick={() => onDeleteNote?.(note.id)} className="p-1 hover:text-destructive transition-colors">
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
										</div>
										<p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
											{note.text}
										</p>
									</>
								)}
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
						<Plus className="w-5 h-5" />
					</button>
				</form>
			</div>
		)
	}

	if (activePanel === "topics") {
		return (
			<div className="flex flex-col h-full w-full px-6 pb-6 animate-in fade-in duration-500">
				<h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-3">
					<div className="p-2 bg-primary/20 rounded-lg text-primary">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h7" /></svg>
					</div>
					Video Topics
				</h2>

				<div className="flex-1 overflow-y-auto space-y-3 mb-4">
					{isGeneratingTopics ? (
						<div className="h-full flex flex-col items-center justify-center text-center p-8">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
							<p className="text-sm text-muted-foreground">AI is analyzing the video content...</p>
						</div>
					) : topics.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
							<p className="text-sm">No topics available for this video yet.</p>
						</div>
					) : (
						topics.map((topic, i) => (
							<button
								key={i}
								onClick={() => {
									onSendMessage(`Tell me more about "${topic}" from this video.`)
								}}
								className="w-full text-left p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 hover:border-primary/30 transition-all group"
							>
								<div className="flex items-center justify-between mb-1">
									<span className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-70">Topic {i + 1}</span>
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
								</div>
								<p className="text-sm font-semibold">{topic}</p>
							</button>
						))
					)}
				</div>
				<p className="text-[10px] text-muted-foreground text-center">Click a topic to ask the AI for more details about it.</p>
			</div>
		)
	}

	if (activePanel === "sessions") {
		return (
			<div className="flex flex-col h-full w-full px-6 pb-6 animate-in fade-in duration-500">
				<h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-3">
					<div className="p-2 bg-primary/20 rounded-lg text-primary">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9l-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /></svg>
					</div>
					My Sessions
				</h2>

				<div className="flex-1 overflow-y-auto space-y-2 mb-4">
					{sessions.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
							<p className="text-sm">You haven't created any sessions yet.</p>
						</div>
					) : (
						sessions.map((session) => (
							<div
								key={session.id}
								className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${session.id === currentSessionId
										? "bg-primary/10 border-primary/30 shadow-sm"
										: "bg-muted/20 border-border/50 hover:bg-muted/40 hover:border-border"
									}`}
							>
								{editingSessionId === session.id ? (
									<div className="flex-1 flex gap-2">
										<input
											value={editSessionName}
											onChange={(e) => setEditSessionName(e.target.value)}
											className="flex-1 bg-background border border-primary/50 rounded-lg px-2 py-1 text-sm focus:outline-none"
											autoFocus
										/>
										<button onClick={saveEditedSession} className="text-primary p-1">
											<Check className="w-4 h-4" />
										</button>
										<button onClick={() => setEditingSessionId(null)} className="text-muted-foreground p-1">
											<X className="w-4 h-4" />
										</button>
									</div>
								) : (
									<>
										<button
											onClick={() => onSwitchSession?.(session.id)}
											className="flex-1 text-left truncate text-sm font-semibold"
										>
											{session.name}
										</button>
										<div className="flex gap-1">
											<button
												onClick={() => startEditingSession(session)}
												className="p-1.5 hover:bg-background rounded-lg text-muted-foreground hover:text-primary transition-colors"
											>
												<Edit3 className="w-3.5 h-3.5" />
											</button>
											<button
												onClick={() => onDeleteSession?.(session.id)}
												className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
											>
												<Trash2 className="w-3.5 h-3.5" />
											</button>
										</div>
									</>
								)}
							</div>
						))
					)}
				</div>

				<form onSubmit={handleCreateSession} className="flex gap-2">
					<input
						value={sessionInput}
						onChange={(e) => setSessionInput(e.target.value)}
						className="flex-1 h-12 rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
						placeholder="New session name..."
					/>
					<button
						type="submit"
						className="inline-flex items-center justify-center rounded-xl font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-12 shadow-sm"
					>
						<Plus className="w-5 h-5" />
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
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>
					</div>
					Up Next
				</h2>

				<div className="flex-1 overflow-y-auto space-y-3 mb-4">
					{queue.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
							<p className="text-sm">Your queue is empty.</p>
						</div>
					) : (
						queue.map((item, index) => (
							<div
								key={`${item.id}-${index}`}
								className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all ${item.id === currentVideoId
										? "bg-primary/10 border-primary/30 shadow-sm"
										: "bg-muted/20 border-border/50 hover:bg-muted/40"
									}`}
							>
								<div className="text-[10px] font-bold text-muted-foreground w-4 flex items-center justify-center">
									{item.id === currentVideoId ? <Play className="w-3 h-3 text-primary fill-primary" /> : index + 1}
								</div>
								<div className="flex-1 truncate text-sm font-medium pr-2">
									{item.title}
								</div>
								<div className="flex gap-1">
									{item.id !== currentVideoId && (
										<button
											onClick={() => onPlayFromQueue?.(item.id)}
											className="p-1.5 hover:bg-background rounded-lg text-primary transition-colors"
										>
											<Play className="w-3.5 h-3.5 fill-primary" />
										</button>
									)}
									<button
										onClick={() => onRemoveFromQueue?.(item.id)}
										className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</button>
								</div>
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
							<Plus className="w-5 h-5" />
						)}
					</button>
				</form>
			</div>
		)
	}

	return null
}
