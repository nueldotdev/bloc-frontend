import { supabase } from './supabase'

/**
 * Uploads a file to the "media" bucket in Supabase.
 * @param file The file to upload
 * @param folder The folder path (e.g. 'avatars' or 'covers')
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(file: File, folder: string): Promise<string> {
    try {
        // Enforce 5MB limit
        if (file.size > 5 * 1024 * 1024) {
            throw new Error("File size must be under 5MB.")
        }

        // Check if user is authenticated (Supabase RLS requires auth.uid())
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) {
            throw new Error("You must be logged in to upload files.")
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${authData.user.id}/${folder}/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            console.error("Supabase Storage Upload Error:", uploadError)
            throw new Error(uploadError.message)
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath)

        return publicUrl
    } catch (error: any) {
        console.error("uploadFile failed:", error)
        throw new Error(error.message || "Failed to upload file")
    }
}
