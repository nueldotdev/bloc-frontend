import { useState, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import DashboardLayout from "@/components/app/DashboardLayout"
import { uploadFile } from "@/lib/upload"

export default function Settings() {
    const { user, profile: authProfile, refreshProfile } = useAuth()
    const [profile, setProfile] = useState<any>(null)
    const [saving, setSaving] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Sync profile when authProfile is loaded for the first time
    const hasInitializedRef = useRef(false)
    if (authProfile && !hasInitializedRef.current) {
        setProfile(authProfile)
        hasInitializedRef.current = true
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingAvatar(true)
        try {
            const url = await uploadFile(file, 'avatars')
            setProfile({ ...profile, avatar_url: url })
        } catch (error: any) {
            alert(error.message || "Failed to upload avatar.")
        } finally {
            setUploadingAvatar(false)
        }
    }


    const saveSettings = async () => {
        if (!user || !profile) return
        setSaving(true)
        try {
            await api.put(`profiles/${user.id}`, profile)
            await refreshProfile()
            alert("Settings saved successfully!")
        } catch (e) {
            console.error("Failed to save settings", e)
            alert("Failed to save settings.")
        } finally {
            setSaving(false)
        }
    }

    if (!profile) return <div className="min-h-screen flex items-center justify-center">Loading settings...</div>

    return (
        <DashboardLayout>
                <h1 className="text-4xl font-bold tracking-tight mb-8">Settings</h1>
                
                <div className="max-w-xl space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Profile</h2>
                        </div>
                        <div className="flex items-center gap-6">
                            <div 
                                className="w-24 h-24 shrink-0 rounded-full overflow-hidden bg-muted border-2 border-border/50 relative group cursor-pointer shadow-sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground/50">
                                        {profile?.full_name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                )}
                                
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white/90">
                                    {uploadingAvatar ? (
                                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <span className="text-xs font-bold uppercase tracking-wider">Upload</span>
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleAvatarUpload} 
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input className="h-12 rounded-xl" value={profile?.full_name || ""} onChange={(e) => setProfile({...profile, full_name: e.target.value})} placeholder="Your name" />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6 border-t pt-8 border-border">
                        <h2 className="text-xl font-bold">Learning Preferences</h2>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50">
                            <div className="space-y-0.5">
                                <label className="text-sm font-semibold">Enable Sanity Checks</label>
                                <p className="text-xs text-muted-foreground">Get prompts to keep you engaged.</p>
                            </div>
                            <Switch checked={profile?.sanity_checks_enabled ?? true} onCheckedChange={() => setProfile({...profile, sanity_checks_enabled: !profile?.sanity_checks_enabled})} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Intensity Level</label>
                                <select 
                                    className="w-full h-12 px-4 rounded-xl border-2 bg-background focus:border-primary transition-all outline-none"
                                    value={profile?.learning_intensity || 'standard'}
                                    onChange={(e) => setProfile({...profile, learning_intensity: e.target.value})}
                                >
                                    <option value="passive">Passive (No Checks)</option>
                                    <option value="standard">Standard (Random)</option>
                                    <option value="hardcore">Hardcore (Concept Driven)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Check Type</label>
                                <select 
                                    className="w-full h-12 px-4 rounded-xl border-2 bg-background focus:border-primary transition-all outline-none"
                                    value={profile?.preferred_check_type || 'focus'}
                                    onChange={(e) => setProfile({...profile, preferred_check_type: e.target.value})}
                                >
                                    <option value="focus">Focus Checks (Presence)</option>
                                    <option value="concept">Concept Checks (AI-Generated)</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <Button size="lg" className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20" onClick={saveSettings} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
        </DashboardLayout>
    )
}

