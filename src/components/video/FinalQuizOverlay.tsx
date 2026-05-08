import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, X, RefreshCw, Trophy, ChevronRight, ChevronLeft } from "lucide-react"

interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

export default function FinalQuizOverlay({ 
    quizData, 
    onClose 
}: { 
    quizData: Question[], 
    onClose: () => void 
}) {
    const [currentStep, setCurrentStep] = useState<"intro" | "quiz" | "result">("intro")
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [showExplanation, setShowExplanation] = useState(false)
    const [score, setScore] = useState(0)

    const handleAnswer = (option: string) => {
        if (showExplanation) return
        const question = quizData[currentQuestionIndex]
        setAnswers(prev => ({ ...prev, [question.id]: option }))
        setShowExplanation(true)
        
        if (option === question.correctAnswer) {
            setScore(prev => prev + 1)
        }
    }

    const nextQuestion = () => {
        if (currentQuestionIndex < quizData.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
            setShowExplanation(false)
        } else {
            setCurrentStep("result")
        }
    }

    const getOptionLetter = (index: number) => ["A", "B", "C", "D"][index]

    if (currentStep === "intro") {
        return (
            <div className="absolute inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-500">
                <div className="max-w-md w-full bg-card border border-border p-10 rounded-[3rem] shadow-2xl text-center space-y-8">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto shadow-inner">
                        <Trophy className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">Final Assessment</h2>
                        <p className="text-muted-foreground text-sm font-medium">You've finished the video! Ready to test what you've learned?</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 text-xs font-bold uppercase tracking-widest text-primary/70">
                        5 Questions • AI Generated • Mastery Check
                    </div>
                    <Button onClick={() => setCurrentStep("quiz")} className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                        Start Quiz
                    </Button>
                </div>
            </div>
        )
    }

    if (currentStep === "result") {
        const percentage = (score / quizData.length) * 100
        return (
            <div className="absolute inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
                <div className="max-w-md w-full bg-card border border-border p-10 rounded-[3rem] shadow-2xl text-center space-y-8">
                    <div className="relative w-32 h-32 mx-auto">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle className="text-muted stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                            <circle className="text-primary stroke-current transition-all duration-1000 ease-out" strokeWidth="8" strokeDasharray={`${percentage * 2.51}, 251.2`} strokeLinecap="round" fill="transparent" r="40" cx="50" cy="50" transform="rotate(-90 50 50)" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-3xl font-black text-foreground">{score}/{quizData.length}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">
                            {percentage >= 80 ? "Mastery Achieved!" : percentage >= 50 ? "Good Progress!" : "Keep Learning!"}
                        </h2>
                        <p className="text-muted-foreground text-sm font-medium">
                            {percentage >= 80 ? "Excellent work! You've grasped the core concepts of this video." : "You're getting there. Review your notes to bridge the gaps."}
                        </p>
                    </div>

                    <Button onClick={onClose} className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all active:scale-95">
                        Finish Session
                    </Button>
                </div>
            </div>
        )
    }

    const currentQuestion = quizData[currentQuestionIndex]
    const selectedAnswer = answers[currentQuestion.id]

    return (
        <div className="absolute inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="max-w-2xl w-full bg-card border border-border p-8 md:p-12 rounded-[3rem] shadow-2xl space-y-8 overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/10">
                        Question {currentQuestionIndex + 1} of {quizData.length}
                    </span>
                    <div className="flex gap-1">
                        {quizData.map((_, i) => (
                            <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i === currentQuestionIndex ? "bg-primary w-10" : i < currentQuestionIndex ? "bg-primary/40" : "bg-muted"}`} />
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold leading-tight text-foreground">{currentQuestion.question}</h2>
                    
                    <div className="grid gap-3">
                        {currentQuestion.options.map((option, i) => {
                            const letter = getOptionLetter(i)
                            const isSelected = selectedAnswer === letter
                            const isCorrect = letter === currentQuestion.correctAnswer
                            
                            let stateClass = "border-border hover:border-primary/30 hover:bg-muted/30"
                            if (showExplanation) {
                                if (isCorrect) stateClass = "border-green-500 bg-green-500/10 text-green-600"
                                else if (isSelected) stateClass = "border-destructive bg-destructive/10 text-destructive"
                                else stateClass = "opacity-50 border-border"
                            } else if (isSelected) {
                                stateClass = "border-primary bg-primary/5 text-primary"
                            }

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(letter)}
                                    disabled={showExplanation}
                                    className={`w-full p-5 rounded-2xl text-left text-sm font-semibold transition-all border-2 flex items-center gap-4 ${stateClass}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs border-2 shrink-0 ${isSelected ? "border-current bg-current/10" : "border-border"}`}>
                                        {letter}
                                    </div>
                                    <span className="flex-1">{option}</span>
                                    {showExplanation && isCorrect && <Check className="w-5 h-5 text-green-500" />}
                                    {showExplanation && isSelected && !isCorrect && <X className="w-5 h-5 text-destructive" />}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {showExplanation && (
                    <div className="bg-muted/30 p-6 rounded-[2rem] border border-border/50 animate-in slide-in-from-top-4 duration-500">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Explanation</p>
                        <p className="text-sm leading-relaxed text-foreground/80">{currentQuestion.explanation}</p>
                        <Button 
                            onClick={nextQuestion} 
                            className="mt-6 w-full h-12 rounded-xl font-bold gap-2"
                        >
                            {currentQuestionIndex === quizData.length - 1 ? "See Results" : "Next Question"}
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
