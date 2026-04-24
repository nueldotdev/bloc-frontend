// src/components/video/TranscriptInput.tsx
import React, { useState } from 'react';
import { Textarea } from '../ui/textarea'; // Assuming a shadcn/ui textarea component

interface TranscriptInputProps {
    onTranscriptChange: (transcript: string) => void;
    initialTranscript?: string;
}

export const TranscriptInput: React.FC<TranscriptInputProps> = ({ onTranscriptChange, initialTranscript = '' }) => {
    const [transcript, setTranscript] = useState(initialTranscript);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newTranscript = e.target.value;
        setTranscript(newTranscript);
        onTranscriptChange(newTranscript);
    };

    return (
        <div className="p-4 border rounded-lg bg-card shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Video Transcript Input (Optional)</h3>
            <p className="text-sm text-muted-foreground mb-3">
                Paste the video transcript here to provide context to the AI assistant.
                This will help the AI answer questions more accurately about the video content.
            </p>
            <Textarea
                placeholder="Paste your video transcript here..."
                value={transcript}
                onChange={handleChange}
                rows={10}
                className="w-full resize-y min-h-[150px]"
            />
        </div>
    );
};
