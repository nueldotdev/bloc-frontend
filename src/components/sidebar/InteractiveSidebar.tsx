import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import {
	Trash2,
	Edit3,
	Check,
	Play,
	Plus
} from "lucide-react"
import { Button } from "../ui/button"
import { useAuth } from "../auth-provider"
import SessionModal from "../app/SessionModal"
import BlocEditor from "../app/editor/BlocEditor"

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
	cover_url?: string;
	queue?: any[];
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
	onEditMessage,
	topics = [],
	sessions = [],
	currentSessionId = "",
	onSwitchSession,
	onCreateSession,
	onUpdateSession,
	onDeleteSession,
	isGeneratingTopics = false,
	isAiLoading = false,
	videoTranscript = "",
	onTranscriptUpdate,
	isPreview = false
}: {
	activePanel: "chat" | "notes" | "queue" | "topics" | "sessions" | "transcript" | null;

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
	onEditMessage?: (id: string, text: string) => void,
	topics?: Topic[],
	sessions?: Session[],
	currentSessionId?: string,
	onSwitchSession?: (id: string) => void,
	onCreateSession?: (name: string, description?: string, coverUrl?: string) => void,
	onUpdateSession?: (id: string, name: string, description?: string, coverUrl?: string) => void,
	onDeleteSession?: (id: string) => void,
	isGeneratingTopics?: boolean,
	isAiLoading?: boolean,
	videoTranscript?: string,
	onTranscriptUpdate?: (text: string) => void,
	isPreview?: boolean
}) {
	const { profile } = useAuth()
	const [inputText, setInputText] = useState("")
	const [queueInput, setQueueInput] = useState("")
	const [chatInput, setChatInput] = useState("")
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [selectedSession, setSelectedSession] = useState<Session | null>(null)
	const [isFetching, setIsFetching] = useState(false)

	const chatContainerRef = useRef<HTMLDivElement>(null)
	const [notesClearSignal, setNotesClearSignal] = useState(false)
	const [chatClearSignal, setChatClearSignal] = useState(false)
	const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
	const [editingChatId, setEditingChatId] = useState<string | null>(null)

	// Auto-scroll to bottom of chat
	useEffect(() => {
		if (activePanel === "chat" && chatContainerRef.current) {
			chatContainerRef.current.scrollTo({
				top: chatContainerRef.current.scrollHeight,
				behavior: "smooth"
			})
		}
	}, [chatHistory, isAiLoading, activePanel])

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
		
		if (editingNoteId && onEditNote) {
			onEditNote(editingNoteId, inputText.trim())
			setEditingNoteId(null)
		} else {
			onAddNote(inputText.trim())
		}

		setInputText("")
		setNotesClearSignal(true)
		setTimeout(() => setNotesClearSignal(false), 100)
	}

	const startEditingNote = (note: Note) => {
		setEditingNoteId(note.id)
		setInputText(note.text)
		// We can't easily "force" Lexical to update from outside without a prop 
		// but since we're replacing the whole input experience, let's assume 
		// the user wants to see the text in the editor.
	}

	const handleSendChat = (e?: React.FormEvent) => {
		e?.preventDefault()
		if (!chatInput.trim()) return
		
		if (editingChatId && onEditMessage) {
			onEditMessage(editingChatId, chatInput.trim())
			setEditingChatId(null)
		} else {
			onSendMessage(chatInput.trim())
		}

		setChatInput("")
		setChatClearSignal(true)
		setTimeout(() => setChatClearSignal(false), 100)
	}

	const startEditingChat = (msg: ChatMessage) => {
		setEditingChatId(msg.id)
		setChatInput(msg.text)
	}

	const handleSessionSubmit = async (data: any) => {
		if (selectedSession && onUpdateSession) {
			await onUpdateSession(selectedSession.id, data.name, data.description, data.coverUrl)
		} else if (onCreateSession) {
			await onCreateSession(data.name, data.description, data.coverUrl)
		}
	}

	const openCreateModal = () => {
		setSelectedSession(null)
		setIsModalOpen(true)
	}

	const openEditModal = (session: Session) => {
		setSelectedSession(session)
		setIsModalOpen(true)
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
						<div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
							<div className="shrink-0 h-8 w-8 rounded-full overflow-hidden bg-muted border border-border">
								{msg.role === 'user' ? (
									profile?.avatar_url ? (
										<img src={profile.avatar_url} alt="You" className="h-full w-full object-cover" />
									) : (
										<div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold">
											YOU
										</div>
									)
								) : (
									<div className="h-full w-full flex items-center justify-center bg-accent text-accent-foreground">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
									</div>
								)}
							</div>
							<div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] group`}>
								<div className={`p-4 rounded-2xl text-sm shadow-sm leading-relaxed relative ${msg.role === 'user'
									? 'bg-primary text-primary-foreground rounded-tr-sm'
									: 'bg-background border border-border text-foreground rounded-tl-sm'
								}`}>
								{msg.role === 'ai' || msg.role === 'user' ? (
									<div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-invert'}`}>
										<ReactMarkdown
											remarkPlugins={[remarkMath]}
											rehypePlugins={[rehypeKatex]}
											components={{
												p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
												ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
												ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
												code: ({ children }) => <code className={`${msg.role === 'user' ? 'bg-primary-foreground/20' : 'bg-muted'} px-1 rounded font-mono text-[12px]`}>{children}</code>
											}}
										>
											{msg.text}
										</ReactMarkdown>
									</div>
								) : (
									msg.text
								)}
								
								{msg.role === 'user' && !isPreview && (
									<div className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
										<button 
											onClick={() => startEditingChat(msg)}
											className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
											title="Edit Message"
										>
											<Edit3 className="w-4 h-4" />
										</button>
									</div>
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

				{!isPreview && (
				<div className="flex flex-col gap-2 bg-muted/20 p-3 rounded-2xl border border-border/50 relative">
					{editingChatId && (
						<div className="absolute -top-3 left-4 px-2 py-0.5 bg-primary text-[9px] font-bold text-primary-foreground rounded-full shadow-sm z-10 animate-in fade-in slide-in-from-bottom-1">
							EDITING MESSAGE
						</div>
					)}
					<BlocEditor 
						value={chatInput}
						onChange={setChatInput}
						placeholder="Ask a question (type / for commands)..."
						clearSignal={chatClearSignal}
					/>
					<div className="flex justify-between items-center border-t border-border/50 pt-2">
						<span className="text-[10px] text-muted-foreground">
							Type <code className="bg-muted px-1 rounded">/</code> for commands
						</span>
						<button 
							onClick={() => handleSendChat()}
							className="inline-flex items-center justify-center rounded-xl font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8 shadow-sm"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
						</button>
					</div>
				</div>
				)}
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
										<p className="text-xs text-primary font-bold animate-pulse">
											Editing in main box below...
										</p>
										<div className="flex justify-end gap-2">
											<Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => {
												setEditingNoteId(null)
												setInputText("")
												setNotesClearSignal(true)
												setTimeout(() => setNotesClearSignal(false), 100)
											}}>
												Cancel
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
												{!isPreview && (
													<>
														<button onClick={() => startEditingNote(note)} className="p-1 hover:text-primary transition-colors">
															<Edit3 className="w-3.5 h-3.5" />
														</button>
														<button onClick={() => onDeleteNote?.(note.id)} className="p-1 hover:text-destructive transition-colors">
															<Trash2 className="w-3.5 h-3.5" />
														</button>
													</>
												)}
											</div>
										</div>
										<div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed text-foreground/90">
											<ReactMarkdown
												remarkPlugins={[remarkMath]}
												rehypePlugins={[rehypeKatex]}
											>
												{note.text}
											</ReactMarkdown>
										</div>
									</>
								)}
							</div>
						))
					)}
				</div>

				{!isPreview && (
				<div className="flex flex-col gap-2 bg-muted/20 p-3 rounded-2xl border border-border/50 relative">
					{editingNoteId && (
						<div className="absolute -top-3 left-4 px-2 py-0.5 bg-primary text-[9px] font-bold text-primary-foreground rounded-full shadow-sm z-10 animate-in fade-in slide-in-from-bottom-1">
							EDITING NOTE
						</div>
					)}
					<BlocEditor 
						value={inputText}
						onChange={setInputText}
						placeholder="Add a note (type / for commands)..."
						clearSignal={notesClearSignal}
					/>
					<div className="flex justify-between items-center border-t border-border/50 pt-2">
						<span className="text-[10px] text-muted-foreground">
							{editingNoteId ? "Press Save to update your note" : "Type / for math & formatting"}
						</span>
						<button
							onClick={() => handleAddNote()}
							className="inline-flex items-center justify-center rounded-xl font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 text-xs shadow-sm gap-2"
						>
							{editingNoteId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
							{editingNoteId ? "Update Note" : "Save Note"}
						</button>
					</div>
				</div>
				)}
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
								disabled={isPreview}
								onClick={() => {
									if (!isPreview) onSendMessage(`Tell me more about "${topic}" from this video.`)
								}}
								className="w-full text-left p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 hover:border-primary/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<div className="flex items-center justify-between mb-1">
									<span className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-70">Topic {i + 1}</span>
									{!isPreview && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>}
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

	if (activePanel === "transcript") {
		return (
			<div className="flex flex-col h-full w-full px-6 pb-6 animate-in fade-in duration-500">
				<h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-3">
					<div className="p-2 bg-primary/20 rounded-lg text-primary">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
					</div>
					Video Transcript
				</h2>

				<div className="flex-1 overflow-y-auto space-y-4 pr-1">
					<div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
						<h4 className="text-sm font-bold mb-2">Manual Transcript Sync</h4>
						<p className="text-xs text-muted-foreground mb-4 leading-relaxed">
							If auto-sync fails, paste the video transcript here. This helps the AI understand the content for quizzes and chat.
						</p>
						<textarea
							value={videoTranscript}
							onChange={(e) => onTranscriptUpdate?.(e.target.value)}
							placeholder="Paste transcript content here..."
							className="w-full h-[400px] bg-background border border-border rounded-xl p-4 text-xs focus:ring-2 focus:ring-primary outline-none transition-all resize-none font-sans"
						/>
					</div>
					
					{videoTranscript && (
						<div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl">
							<div className="flex items-center gap-2 text-primary mb-1">
								<Check className="w-4 h-4" />
								<span className="text-xs font-bold">Transcript Linked</span>
							</div>
							<p className="text-[10px] text-muted-foreground">
								The AI is currently using the transcript provided above for context.
							</p>
						</div>
					)}
				</div>
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
								{session.cover_url ? (
									<div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-border">
										<img src={session.cover_url} alt="" className="h-full w-full object-cover" />
									</div>
								) : (
									<div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center border border-border text-muted-foreground">
										<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9l-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /></svg>
									</div>
								)}
								
								{session.cover_url ? (
									<div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-border">
										<img src={session.cover_url} alt="" className="h-full w-full object-cover" />
									</div>
								) : (
									<div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center border border-border text-muted-foreground">
										<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9l-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /></svg>
									</div>
								)}
								
								<button
									onClick={() => onSwitchSession?.(session.id)}
									className="flex-1 text-left truncate text-sm font-semibold"
								>
									{session.name}
								</button>
								{!isPreview && (
								<div className="flex gap-1">
									<button
										onClick={() => openEditModal(session)}
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
								)}
							</div>
						))
					)}
				</div>

				{!isPreview && (
				<Button onClick={openCreateModal} className="h-12 w-full rounded-xl font-bold gap-2 shadow-sm">
					<Plus className="w-5 h-5" />
					New Session
				</Button>
				)}

				<SessionModal 
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					onSubmit={handleSessionSubmit}
					initialData={selectedSession}
					title={selectedSession ? "Edit Session" : "Create Session"}
				/>
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
									{!isPreview && (
									<button
										onClick={() => onRemoveFromQueue?.(item.id)}
										className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</button>
									)}
								</div>
							</div>
						))
					)}
				</div>

				{!isPreview && (
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
				)}
			</div>
		)
	}

	return null
}
