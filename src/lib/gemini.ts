import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
// console.log(import.meta.env.VITE_GEMINI_KEY)
const SYSTEM_PROMPT = `
You are a helpful AI study assistant integrated into "Bloc", a distraction-free YouTube learning platform.
Your goal is to help users understand the video they are currently watching.
You have access to the video context provided by the user.
Be concise, educational, and encouraging.
If the user asks about something specific in the video, try to relate it to the timestamp they are currently at.
`;

export const getGeminiResponse = async (userMessage: string, history: { role: string, parts: { text: string }[] }[], videoTranscript?: string) => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const chat = model.startChat({
        history: history,
        generationConfig: {
            maxOutputTokens: 500,
        },
    });

    let prompt = `${SYSTEM_PROMPT}\n\n`;
    if (videoTranscript) {
        prompt += `Video Transcript:\n${videoTranscript}\n\n`;
    }
    prompt += `User: ${userMessage}`;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
};
