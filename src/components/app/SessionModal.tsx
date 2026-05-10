import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Image as ImageIcon, X, UploadCloud } from "lucide-react"
import { uploadFile } from "@/lib/upload"

interface SessionData {
  id?: string
  name: string
  description?: string
  cover_url?: string
  initial_url?: string
}

interface SessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  initialData?: SessionData | null
  title?: string
}

export default function SessionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = "Session Details",
}: SessionModalProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [coverUrl, setCoverUrl] = useState(initialData?.cover_url || "")
  const [initialUrl, setInitialUrl] = useState(initialData?.initial_url || "")
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const url = await uploadFile(file, "covers")
      setCoverUrl(url)
    } catch (error: any) {
      alert(error.message || "Failed to upload cover.")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        coverUrl,
        initialUrl: initialUrl.trim(),
      })
      onClose()
    } catch (error) {
      console.error("Failed to save session:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-border bg-card p-0 overflow-hidden shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">{title}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Set the name and appearance for your learning session.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Cover Image Upload Area */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold ml-1">Cover Image</Label>
                <div 
                  className="relative h-40 w-full rounded-3xl bg-muted/30 border-2 border-dashed border-border/60 hover:border-primary/40 transition-all cursor-pointer overflow-hidden group flex flex-col items-center justify-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {coverUrl ? (
                    <>
                      <img src={coverUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button type="button" variant="secondary" size="sm" className="rounded-xl font-bold gap-2">
                          <UploadCloud className="w-4 h-4" />
                          Change Image
                        </Button>
                      </div>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-3 right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setCoverUrl(""); }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center shadow-sm border border-border group-hover:text-primary transition-colors">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold">Upload a cover</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Max 5MB • JPG, PNG</p>
                      </div>
                    </>
                  )}
                  
                  {uploading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-xs font-bold text-primary animate-pulse">Uploading...</p>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleCoverUpload} 
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold ml-1">Session Name</Label>
                  <Input 
                    id="name"
                    placeholder="e.g. Advanced Quantum Mechanics" 
                    className="h-12 rounded-xl bg-muted/20 border-2 focus:border-primary/50"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold ml-1">Description</Label>
                  <Textarea 
                    id="description"
                    placeholder="What are you focusing on in this session?" 
                    className="rounded-xl bg-muted/20 border-2 focus:border-primary/50 min-h-[100px] resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {!initialData && (
                   <div className="space-y-2">
                    <Label htmlFor="url" className="text-sm font-semibold ml-1">YouTube URL (Optional)</Label>
                    <Input 
                      id="url"
                      placeholder="https://youtube.com/watch?v=..." 
                      className="h-12 rounded-xl bg-muted/20 border-2 focus:border-primary/50"
                      value={initialUrl}
                      onChange={(e) => setInitialUrl(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-muted/30 p-6 border-t border-border">
            <div className="flex gap-3 w-full sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold h-11 px-6">
                Cancel
              </Button>
              <Button type="submit" disabled={loading || uploading || !name.trim()} className="rounded-xl font-bold h-11 px-8 shadow-lg shadow-primary/20 transition-all active:scale-95 flex-1 sm:flex-none">
                {loading ? (
                   <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  initialData ? "Save Changes" : "Create Session"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
