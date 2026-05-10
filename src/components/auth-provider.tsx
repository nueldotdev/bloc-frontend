import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import api from "@/lib/api"
import type { User, Session } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: any
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const syncProfile = async (user: User | null) => {
      if (!user) return
      
      try {
        const profileRes = await api.get<{ data: any }>(`profiles/${user.id}`)
        const profile = profileRes.data
        setProfile(profile)
        // If name is missing or default, sync from metadata
        const metadataName = user.user_metadata?.full_name || user.user_metadata?.name
        if ((!profile?.full_name || profile.full_name === "New Learner") && metadataName) {
            await api.put(`profiles/${user.id}`, { 
                ...profile, 
                full_name: metadataName 
            })
        }
      } catch (e) {
        console.error("Failed to sync profile:", e)
      }
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) syncProfile(session.user)
      setLoading(false)
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) syncProfile(session.user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    session,
    loading,
    profile,
    signInWithGoogle,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
