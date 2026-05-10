import { X, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ContinueSessionData {
    id: string;
    name: string;
    last_video_id: string;
    last_timestamp: number;
    queue: { id: string, title: string }[];
}

interface ContinueWatchingProps {
    session: ContinueSessionData;
    onContinue: (session: ContinueSessionData) => void;
    onCancel: () => void;
}

export default function ContinueWatching({ session, onContinue, onCancel }: ContinueWatchingProps) {
    if (!session || !session.last_video_id) return null;

    // Look up title from queue
    const queueItem = session.queue?.find(q => q.id === session.last_video_id);
    const videoTitle = queueItem ? queueItem.title : "Unknown Video";
    const thumbnailUrl = `https://img.youtube.com/vi/${session.last_video_id}/mqdefault.jpg`;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-8 fade-in duration-500">
            <div className="bg-card border border-border shadow-2xl rounded-2xl overflow-hidden w-[320px] flex flex-col group relative">
                <button 
                    onClick={onCancel}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm"
                    title="Dismiss"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
                
                <div className="relative h-40 w-full overflow-hidden bg-black">
                    <img 
                        src={thumbnailUrl} 
                        alt="Thumbnail" 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" 
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
                        <div className="p-1.5 bg-primary rounded-full shrink-0">
                            <Play className="w-3.5 h-3.5 fill-primary-foreground text-primary-foreground" />
                        </div>
                        <p className="text-white text-sm font-semibold truncate drop-shadow-md">
                            {videoTitle}
                        </p>
                    </div>
                </div>

                <div className="p-5 flex flex-col">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                        Continue Session
                    </p>
                    <h3 className="font-bold text-lg text-foreground mb-4 truncate">
                        {session.name}
                    </h3>
                    
                    <div className="flex items-center justify-between gap-3 mt-auto">
                        <Button 
                            variant="ghost" 
                            className="flex-1 text-muted-foreground hover:text-foreground"
                            onClick={onCancel}
                        >
                            Dismiss
                        </Button>
                        <Button 
                            className="flex-1 font-bold shadow-md"
                            onClick={() => onContinue(session)}
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
