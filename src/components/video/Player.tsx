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
    onPlaylistLoaded?: (ids: string[]) => void,
    onVideoChange?: (videoId: string) => void
}>(({ videoId, playlistId, onProgress, onDuration, onEnded, onPlaylistLoaded, onVideoChange }, ref) => {
    const [isReady, setIsReady] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const playerRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const lastVideoIdRef = useRef<string>(videoId)
    const hasTriggeredEndRef = useRef<boolean>(false)

    // Use refs for callbacks to avoid stale closures in event listeners
    const onProgressRef = useRef(onProgress)
    const onDurationRef = useRef(onDuration)
    const onEndedRef = useRef(onEnded)
    const onPlaylistLoadedRef = useRef(onPlaylistLoaded)
    const onVideoChangeRef = useRef(onVideoChange)

    useEffect(() => {
        onProgressRef.current = onProgress
        onDurationRef.current = onDuration
        onEndedRef.current = onEnded
        onPlaylistLoadedRef.current = onPlaylistLoaded
        onVideoChangeRef.current = onVideoChange
    }, [onProgress, onDuration, onEnded, onPlaylistLoaded, onVideoChange])

    // Reset end trigger when videoId changes
    useEffect(() => {
        hasTriggeredEndRef.current = false
    }, [videoId])

    useImperativeHandle(ref, () => ({
        seekTo: (seconds: number) => {
            if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                hasTriggeredEndRef.current = false // Allow re-triggering if seeking back
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
                    // Note: If playlistId is provided, YouTube might try to auto-advance.
                    // We handle this by pausing explicitly in Watchpage.
                },
                events: {
                    onReady: () => {
                        if (isMounted) {
                            setIsReady(true)
                            
                            // Check for playlist content
                            if (typeof playerRef.current.getPlaylist === 'function') {
                                const playlistIds = playerRef.current.getPlaylist()
                                if (playlistIds && playlistIds.length > 0 && onPlaylistLoadedRef.current) {
                                    console.log("[Player] Playlist detected, IDs:", playlistIds)
                                    onPlaylistLoadedRef.current(playlistIds)
                                }
                            }

                            const d = playerRef.current.getDuration()
                            if (onDurationRef.current) onDurationRef.current(d)
                            startPolling()
                        }
                    },
                    onStateChange: (event: any) => {
                        console.log("[Player] YouTube State Change:", event.data)
                        // event.data: 
                        // YT.PlayerState.ENDED = 0
                        // YT.PlayerState.PLAYING = 1
                        
                        if (event.data === 1) { // PLAYING
                            const currentId = playerRef.current.getVideoData()?.video_id
                            console.log("[Player] Video Playing. ID:", currentId)
                            if (currentId && currentId !== lastVideoIdRef.current) {
                                console.log("[Player] Video ID changed from", lastVideoIdRef.current, "to", currentId)
                                lastVideoIdRef.current = currentId
                                hasTriggeredEndRef.current = false // Reset for new video
                                if (onVideoChangeRef.current) onVideoChangeRef.current(currentId)
                            }
                        }

                        if (event.data === 0) {
                            console.log("[Player] Video Ended detected (State 0)")
                            try {
                                playerRef.current?.pauseVideo() // Force immediate pause
                            } catch (e) {}
                            
                            if (!hasTriggeredEndRef.current) {
                                hasTriggeredEndRef.current = true
                                if (onEndedRef.current) {
                                    onEndedRef.current()
                                }
                            }
                        }
                    },
                    onError: (e: any) => {
                        console.error("[Player] API Error:", e.data)
                        if (isMounted) setError("Failed to load YouTube player.")
                    }
                }
            }

            if (playlistId) {
                playerConfig.playerVars.listType = 'playlist'
                playerConfig.playerVars.list = playlistId
            }

            playerRef.current = new window.YT.Player(containerRef.current, playerConfig)
        }

        const startPolling = () => {
            pollInterval = window.setInterval(() => {
                if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                    const currentTime = playerRef.current.getCurrentTime()
                    const duration = playerRef.current.getDuration()
                    onProgressRef.current(currentTime)

                    // Backup end detection: trigger if we are at the very end and not playing/buffering
                    // Or if duration is reached.
                    if (duration > 0 && duration - currentTime < 0.5 && !hasTriggeredEndRef.current) {
                        const state = playerRef.current.getPlayerState?.()
                        // If state is ended (0) or if we are just stuck at the end
                        if (state === 0 || (duration - currentTime < 0.15)) {
                            console.log("[Player] End detected via polling", { currentTime, duration, state })
                            try {
                                playerRef.current?.pauseVideo() // Force immediate pause
                            } catch (e) {}
                            
                            hasTriggeredEndRef.current = true
                            if (onEndedRef.current) onEndedRef.current()
                        }
                    }
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
    }, [videoId, playlistId, onProgress])

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