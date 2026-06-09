import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { useAuth } from "@/components/auth-provider"

interface Question {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
}

const STATIC_QUESTIONS: Question[] = [
    {
        question: "Are you still focused on the study material?",
        options: ["Yes, absolutely", "I'm a bit tired", "Just started", "Taking a break"],
        correctIndex: 0
    },
    {
        question: "What is the primary goal of this session?",
        options: ["Learning & Understanding", "Passing time", "Background noise", "Sleeping"],
        correctIndex: 0
    },
    {
        question: "Select the 'Focused' option to continue.",
        options: ["Distracted", "Focused", "Sleepy", "Bored"],
        correctIndex: 1
    }
]

export default function QuizOverlay({ 
    onCorrect, 
    videoId, 
    videoTranscript, 
    currentTime 
}: { 
    onCorrect: () => void,
    videoId?: string,
    videoTranscript?: string,
    currentTime?: number
}) {
    const { profile } = useAuth()
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [isWrong, setIsWrong] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true;
        
        const loadQuestion = async () => {
            if (!isMounted) return;
            setLoading(true)
            
            const isHardcore = profile?.learning_intensity === 'hardcore'
            const isConceptType = profile?.preferred_check_type === 'concept'
            
            console.log("[QuizOverlay] Requesting AI check for timestamp:", currentTime);

            if ((isConceptType || isHardcore) && videoId && videoTranscript && videoTranscript.length > 50) {
                try {
                    const res = await api.post<{ data: Question }>("gemini/sanity-check", {
                        videoId,
                        videoTranscript,
                        timestamp: currentTime || 0,
                        videoTitle: document.title
                    })
                    if (res.data && isMounted) {
                        setCurrentQuestion(res.data)
                        setLoading(false)
                        return
                    }
                } catch (e) {
                    console.error("[QuizOverlay] AI Sanity Check failed:", e)
                }
            }

            if (isMounted) {
                const randomStatic = STATIC_QUESTIONS[Math.floor(Math.random() * STATIC_QUESTIONS.length)]
                setCurrentQuestion(randomStatic)
                setLoading(false)
            }
        }

        loadQuestion()
        
        return () => { isMounted = false; }
    }, [videoId, videoTranscript]) // Remove currentTime and profile to prevent loops. videoTranscript and videoId change only on video switch.

    const handleAnswer = () => {
        if (selectedOption === currentQuestion?.correctIndex) {
            onCorrect()
        } else {
            setIsWrong(true)
            setTimeout(() => setIsWrong(false), 1000)
            setSelectedOption(null)
        }
    }

    if (loading) return (
        <div className="absolute inset-0 z-100 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-8">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground animate-pulse">AI is crafting your sanity check...</p>
        </div>
    )

    if (!currentQuestion) return null

    return (
        <div className="absolute inset-0 z-100 bg-background/95 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
            <div className="max-w-md w-full bg-card border border-border p-8 rounded-3xl shadow-2xl space-y-8">
                <div className="space-y-2 text-center">
                    <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"/><path d="m9 12 2 2 4-4"/></svg>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {profile?.preferred_check_type === 'concept' ? 'AI Concept Check' : 'Sanity Check'}
                    </h2>
                    <p className="text-muted-foreground text-sm">Please answer correctly to continue watching.</p>
                </div>

                <div className="space-y-4">
                    <p className="font-semibold text-lg text-center px-4">{currentQuestion.question}</p>
                    <div className="grid gap-3">
                        {currentQuestion.options.map((option, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedOption(i)}
                                className={`w-full p-4 rounded-xl text-left text-sm font-medium transition-all border-2 ${
                                    selectedOption === i 
                                    ? "border-primary bg-primary/5 text-primary" 
                                    : "border-border hover:border-border/80 bg-muted/20"
                                } ${isWrong && selectedOption === i ? "border-destructive bg-destructive/5 text-destructive animate-shake" : ""}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                <Button 
                    onClick={handleAnswer}
                    disabled={selectedOption === null}
                    className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20"
                >
                    Submit & Continue
                </Button>
            </div>
        </div>
    )
}
