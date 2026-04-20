import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react"

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

export interface PlayerHandle {
    seekTo: (seconds: number) => void;
    pauseVideo: () => void;
    playVideo: () => void;
}

export const Player = forwardRef<PlayerHandle, { 
    videoId: string, 
    playlistId?: string,
    onProgress: (time: number) => void,
    onDuration?: (duration: number) => void,
    onEnded?: () => void,
    onPlaylistLoaded?: (ids: string[]) => void
}>(({ videoId, playlistId, onProgress, onDuration, onEnded, onPlaylistLoaded }, ref) => {
    const [isReady, setIsReady] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const playerRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
        seekTo: (seconds: number) => {
            if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                playerRef.current.seekTo(seconds, true)
                playerRef.current.playVideo()
            }
        },
        pauseVideo: () => {
            if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
                playerRef.current.pauseVideo()
            }
        },
        playVideo: () => {
            if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
                playerRef.current.playVideo()
            }
        }
    }))

    useEffect(() => {
        let isMounted = true
        let pollInterval: number

        const initPlayer = () => {
            if (!window.YT || !window.YT.Player || !containerRef.current) return

            if (playerRef.current) {
                try {
                    playerRef.current.destroy()
                } catch (e) {
                    console.error("Error destroying player:", e)
                }
            }

            const playerConfig: any = {
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    modestbranding: 1,
                    rel: 0,
                    origin: window.location.origin,
                },
                events: {
                    onReady: () => {
                        if (isMounted) {
                            setIsReady(true)
                            
                            // Check for playlist content
                            if (typeof playerRef.current.getPlaylist === 'function') {
                                const playlistIds = playerRef.current.getPlaylist()
                                if (playlistIds && playlistIds.length > 0 && onPlaylistLoaded) {
                                    console.log("[Player] Playlist detected, IDs:", playlistIds)
                                    onPlaylistLoaded(playlistIds)
                                }
                            }

                            const d = playerRef.current.getDuration()
                            if (onDuration) onDuration(d)
                            startPolling()
                        }
                    },
                    onStateChange: (event: any) => {
                        // YT.PlayerState.ENDED = 0
                        if (event.data === 0 && onEnded) {
                            onEnded()
                        }
                    },
                    onError: (e: any) => {
                        console.error("[Player] API Error:", e.data)
                        if (isMounted) setError("Failed to load YouTube player.")
                    }
                }
            }

            if (playlistId) {
                // If we have a playlist ID, we use the listType to load the whole thing
                playerConfig.playerVars.listType = 'playlist'
                playerConfig.playerVars.list = playlistId
                // If no specific videoId was provided, YouTube will start at the beginning
            }

            playerRef.current = new window.YT.Player(containerRef.current, playerConfig)
        }

        const startPolling = () => {
            pollInterval = window.setInterval(() => {
                if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                    const currentTime = playerRef.current.getCurrentTime()
                    onProgress(currentTime)
                }
            }, 500)
        }

        // Load API if not already present
        if (!window.YT) {
            const tag = document.createElement('script')
            tag.src = "https://www.youtube.com/iframe_api"
            const firstScriptTag = document.getElementsByTagName('script')[0]
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

            window.onYouTubeIframeAPIReady = () => {
                if (isMounted) initPlayer()
            }
        } else {
            initPlayer()
        }

        return () => {
            isMounted = false
            window.clearInterval(pollInterval)
            if (playerRef.current) {
                try {
                    playerRef.current.destroy()
                } catch (e) {}
            }
        }
    }, [videoId, onProgress])

    return (
        <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
            <div ref={containerRef} className="w-full h-full" />
            
            {!isReady && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-white pointer-events-none">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                    <p className="text-sm text-muted-foreground font-medium">Syncing with YouTube...</p>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black p-8 text-center z-50">
                    <div className="max-w-md">
                        <p className="text-destructive font-bold text-lg mb-2">Playback Error</p>
                        <p className="text-muted-foreground text-sm mb-4">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors"
                        >
                            Retry Connection
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
})

export default Player