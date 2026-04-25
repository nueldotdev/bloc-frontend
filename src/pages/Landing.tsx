import Logo from "@/components/app/Logo"
import ScrollToTop from "@/components/app/scrollToTop"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import heroImage from "@/assets/hero.png"
import { useAuth } from "@/components/auth-provider"
import { 
  Layout, 
  MessageSquare, 
  Zap, 
  Notebook, 
  ArrowRight, 
  PlayCircle,
  FolderCode,
  // Twitter,
  LogOut,
  User as UserIcon
} from "lucide-react"

const Landing = () => {
	const [url, setUrl] = useState("")
	const navigate = useNavigate()
    const { user, signInWithGoogle, signOut } = useAuth()

	const scrollInto = (id: string) => {
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!url) return

		let videoId = ""
		let playlistId = ""
		try {
			const urlToParse = url.includes("://") ? url : `https://${url}`
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
			// fallback for raw ID
            if (url.length === 11) videoId = url
		}

		if (videoId || playlistId) {
			const params = new URLSearchParams()
			if (videoId) params.set("v", videoId)
			if (playlistId) params.set("list", playlistId)
			navigate(`/watch?${params.toString()}`)
		}
	}

	return (
		<div className="min-h-screen bg-background font-sans selection:bg-primary/10">
			<ScrollToTop />
			
            {/* Navigation */}
			<nav className="flex px-6 py-4 items-center justify-between fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border/40">
				<Logo />
				<div className="hidden md:flex gap-8">
					<Button variant="ghost" className="text-sm font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
						Home
					</Button>
					<Button variant="ghost" className="text-sm font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => scrollInto("features")}>
						Features
					</Button>
                    <Button variant="ghost" className="text-sm font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => scrollInto("how-it-works")}>
						How it Works
					</Button>
				</div>
				<div className="flex gap-3">
					{user ? (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border">
                                <UserIcon className="w-4 h-4 text-primary" />
                                <span className="text-xs font-medium truncate max-w-[120px]">{user.email}</span>
                            </div>
                            <Button variant="outline" size="sm" className="cursor-pointer" onClick={signOut}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button variant="outline" size="sm" className="hidden sm:flex cursor-pointer" onClick={signInWithGoogle}>Login</Button>
					        <Button size="sm" className="cursor-pointer" onClick={signInWithGoogle}>Register</Button>
                        </>
                    )}
				</div>
			</nav>

            {/* Hero Section */}
			<section id="hero" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden h-screen">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px]" />
                </div>

				<div className="container mx-auto px-6 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Optimized for Deep Learning
                    </div>

					<h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
						Master your learning, <br/>
						<span className="text-primary italic">distraction-free</span>
					</h1>
					
                    <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Bloc transforms YouTube lectures into a focused study environment with AI assistance, smart check-ins, and integrated note-taking.
                    </p>

					<form onSubmit={handleSubmit} className="mt-10 w-full max-w-xl group animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
						<div className="relative flex items-center">
                            <Input
                                placeholder="Paste YouTube video link here..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full text-lg pl-6 pr-32 h-16 rounded-2xl border-2 focus:ring-4 focus:ring-primary/10 transition-all shadow-xl shadow-primary/5 bg-background"
                            />
                            <Button 
                                type="submit" 
                                className="absolute right-2 h-12 px-6 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                            >
                                Start Learning
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Try any lecture, tutorial, or educational video
                        </p>
					</form>
				</div>
			</section>

            {/* Features Section */}
			<section id="features" className="py-24 bg-muted/30">
				<div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold">Built for serious students</h2>
                        <p className="mt-4 text-muted-foreground">Everything you need to stay focused and absorb information faster.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <Layout className="w-6 h-6" />,
                                title: "Zero Distractions",
                                description: "No recommendations, comments, or ads. Just you and the content you're trying to learn."
                            },
                            {
                                icon: <MessageSquare className="w-6 h-6" />,
                                title: "AI Learning Buddy",
                                description: "Ask questions about the video content and get instant, context-aware answers from Gemini."
                            },
                            {
                                icon: <Zap className="w-6 h-6" />,
                                title: "Focus Guard",
                                description: "Smart check-ins ensure you stay engaged. If you drift off, Bloc brings you back."
                            },
                            {
                                icon: <Notebook className="w-6 h-6" />,
                                title: "Synced Notes",
                                description: "Take notes directly next to the video. All notes are timestamped and easy to review."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-background border border-border/50 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 group">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
				</div>
			</section>

            {/* How it Works */}
            <section id="how-it-works" className="py-24">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <h2 className="text-3xl md:text-5xl font-bold mb-8">How it works</h2>
                            <div className="space-y-8">
                                {[
                                    {
                                        step: "01",
                                        title: "Pick your lecture",
                                        description: "Find a YouTube video you want to learn from and paste the URL into Bloc."
                                    },
                                    {
                                        step: "02",
                                        title: "Enter the zone",
                                        description: "Bloc strips away all distractions and prepares a clean workspace for you."
                                    },
                                    {
                                        step: "03",
                                        title: "Learn & Interrogate",
                                        description: "Watch, take notes, and chat with AI to clarify complex topics as they appear."
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6">
                                        <div className="text-4xl font-bold text-primary/20 shrink-0">{item.step}</div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                                            <p className="text-muted-foreground">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            <div className="aspect-video bg-muted rounded-3xl overflow-hidden shadow-2xl border-8 border-background/50 relative group">
                                <img 
                                    src={heroImage} 
                                    alt="Bloc Interface" 
                                    className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center group-hover:bg-transparent transition-colors">
                                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                        <PlayCircle className="w-10 h-10" />
                                    </div>
                                </div>
                            </div>
                            {/* Decorative element */}
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-border/40">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <Logo />
                        <div className="flex gap-8 text-sm text-muted-foreground">
                            <Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
                            <Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link>
                            <Link to="#" className="hover:text-primary transition-colors">Contact</Link>
                        </div>
                        <div className="flex gap-4">
                            {/* <Button variant="ghost" size="icon" className="rounded-full w-8 h-8">
                                <X className="w-4 h-4" />
                            </Button> */}
                            <Button variant="ghost" size="icon" className="rounded-full w-8 h-8">
                                <FolderCode className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="mt-8 text-center text-sm text-muted-foreground/60 flex flex-col items-center gap-2">
                        <p>&copy; {new Date().getFullYear()} Bloc. Built for the modern student.</p>
                        <p className="text-white/80">
                            by{" "}
                            <a 
                                href="https://nueldotdev.vercel.app" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:underline hover:decoration-red-500 hover:decoration-2 transition-all"
                            >
                                nueldotdev
                            </a>
                        </p>
                    </div>
                </div>
            </footer>
		</div>
	)
}

export default Landing