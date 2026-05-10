import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import api from "@/lib/api"
import {
	Compass,
	Search,
	Users,
	Play,
	Plus
} from "lucide-react"
import DashboardSidebar from "@/components/app/DashboardSidebar"

interface PublicSession {
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

export default function Explore() {
	const { user } = useAuth()
	const navigate = useNavigate()
	const [sessions, setSessions] = useState<PublicSession[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState("")

	useEffect(() => {
		const loadPublicSessions = async () => {
			try {
				const res = await api.get<{ data: PublicSession[] }>("sessions/explore")
				setSessions(res.data)
			} catch (error) {
				console.error("Failed to load public sessions", error)
			} finally {
				setLoading(false)
			}
		}

		loadPublicSessions()
	}, [])

	const handleCloneSession = async (e: React.MouseEvent, session: PublicSession) => {
		e.stopPropagation()
		if (!user) {
			alert("Please log in to join this learning path!")
			return
		}

		if (user.id === session.user_id) {
			navigate("/dashboard")
			return
		}

		try {
			await api.post<{ data: any }>("sessions", {
				name: `${session.name} (Cloned)`,
				initialUrl: session.initial_url,
				queue: session.queue,
				description: session.description,
				isPublic: false
			})
			alert("Learning path joined! You can find it in your dashboard.")
			navigate("/dashboard")
		} catch (error) {
			console.error("Failed to clone session", error)
			alert("Failed to join path. Please try again.")
		}
	}

	const handlePreview = (e: React.MouseEvent, session: PublicSession) => {
		e.stopPropagation()
		if (!session.initial_url) return

		const url = session.initial_url
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

		navigate(`/watch?${params.toString()}`)
	}

	const filteredSessions = sessions.filter(s =>
		s.name.toLowerCase().includes(searchQuery.toLowerCase())
	)

	return (
		<div className="min-h-screen bg-background font-sans text-foreground">
			<DashboardSidebar />

			<main className="lg:ml-64 p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
				<header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
					<div>
						<h1 className="text-4xl font-bold tracking-tight mb-1 flex items-center gap-3">
							Explore
							<div className="bg-primary/10 text-primary text-[10px] uppercase tracking-widest px-2 py-1 rounded-md border border-primary/20">
								Community
							</div>
						</h1>
						<p className="text-muted-foreground text-sm font-medium opacity-80">Discover learning paths curated by students worldwide.</p>
					</div>

					<div className="relative w-full max-w-md group">
						<input
							placeholder="Search topics, skills, or paths..."
							className="w-full pl-12 h-12 rounded-2xl border-2 border-border/60 focus:ring-4 focus:ring-primary/10 transition-all bg-card shadow-sm focus:outline-none focus:border-primary/50"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
					</div>
				</header>

				<section className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
					{loading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
							{[1, 2, 3, 4, 5, 6].map(i => (
								<div key={i} className="h-64 rounded-[2rem] bg-muted/50 animate-pulse border border-border/40" />
							))}
						</div>
					) : filteredSessions.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-32 text-center bg-muted/10 rounded-[3rem] border border-dashed border-border/60">
							<div className="w-20 h-20 rounded-[2rem] bg-background flex items-center justify-center mb-6 shadow-sm border border-border/40 text-muted-foreground/40">
								<Users className="w-10 h-10" />
							</div>
							<h3 className="font-bold text-xl mb-2">No public paths yet</h3>
							<p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">Be the first to share your learning journey with the community!</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
							{filteredSessions.map((session) => (
								<div
									key={session.id}
									onClick={() => navigate(`/explore/${session.id}`)}
									className="group relative border border-border/60 rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:border-primary/20 flex flex-col min-h-[320px] cursor-pointer overflow-hidden"
								>
									{session.cover_url ? (
										<div
											className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
											style={{ backgroundImage: `url(${session.cover_url})` }}
										/>
									) : (
										<div className="absolute inset-0 bg-card hover:bg-muted/10 transition-colors" />
									)}
									<div className={`absolute inset-0 transition-colors ${session.cover_url ? 'bg-black/70 group-hover:bg-black/60' : ''}`} />

									<div className="relative z-10 flex flex-col h-full">
										<div className="flex justify-between items-start mb-6">
											<div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 border border-primary/10">
												<Compass className="w-6 h-6" />
											</div>
											<div className="flex flex-col items-end">
												<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{session.queue?.length || 0} Videos</span>
											</div>
										</div>

										<div className="flex-1">
											<h3 className={`font-bold text-2xl mb-2 group-hover:text-primary transition-colors line-clamp-1 ${session.cover_url ? 'text-white' : 'text-foreground'}`}>
												{session.name}
											</h3>
											<p className={`text-xs line-clamp-2 mb-4 h-8 ${session.cover_url ? 'text-white/70' : 'text-muted-foreground'}`}>
												{session.description || "A curated learning journey designed to help you master new concepts effectively."}
											</p>
											<div className="flex items-center gap-2 mb-4">
												<div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px] border border-primary/10 shadow-inner overflow-hidden shrink-0">
													{session.profiles?.avatar_url ? (
														<img src={session.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
													) : (
														session.profiles?.full_name?.[0]?.toUpperCase() || session.profiles?.email?.[0]?.toUpperCase() || "?"
													)}
												</div>
												<p className={`text-xs font-medium ${session.cover_url ? 'text-white/90' : 'text-muted-foreground'}`}>
													Curated by {session.profiles?.full_name || "a Learner"}
												</p>
											</div>
										</div>

										<div className="mt-8 flex gap-3">
											<Button
												className="flex-1 rounded-xl h-11 font-bold gap-2 shadow-lg shadow-primary/20"
												onClick={(e) => handleCloneSession(e, session)}
											>
												{user?.id === session.user_id ? (
													<>
														<Users className="w-4 h-4" />
														Manage Path
													</>
												) : (
													<>
														<Plus className="w-4 h-4" />
														Join Path
													</>
												)}
											</Button>
											<Button
												variant="outline"
												className="rounded-xl h-11 px-4 border-2"
												title="Preview Content"
												onClick={(e) => handlePreview(e, session)}
											>
												<Play className="w-4 h-4" />
											</Button>
										</div>
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
