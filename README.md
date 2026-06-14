# Bloc - Frontend (Client)

Bloc is a distraction-free, interactive learning platform for YouTube. This frontend is a React application built with TypeScript, Tailwind CSS, and Lexical, designed to transform a passive video-watching experience into an active learning session.

## 🌟 Features

### 1. Mobile-First "Watch" Experience
Taking inspiration from the YouTube mobile app, the Watch page adapts dynamically to screen size:
- **Pinned Video:** The player stays at the top of the screen on mobile.
- **Mobile Nav:** A horizontal control center for switching between Chat, Notes, Topics, and Queue.
- **Keyboard Optimization:** On mobile, the video player and navigation hide automatically when typing to maximize vertical space and prevent UI "squishing."

### 2. Multi-lingual AI Assistant
Integrated with Gemini 3 Flash, the assistant understands the video context and respects user preferences:
- **Contextual Chat:** Ask questions about the current video at specific timestamps.
- **Preferred Language:** Supports 10 languages (English, Spanish, French, etc.) for chat, generated topics, and quizzes.
- **Auto-Topics:** AI analyzes transcripts to identify key learning chapters.

### 3. Interactive Sidebar
- **Study Notes:** A Lexical-based rich text editor supporting Markdown and LaTeX for mathematical equations.
- **Live Queue:** Manage a learning playlist without leaving the focused view.
- **Session Management:** Save and organize different learning paths with custom covers and descriptions.

### 4. Smart Assessments
- **Sanity Checks:** Random AI-generated concept checks to ensure focus.
- **Final Quiz:** A comprehensive 5-question assessment generated at the end of every video to validate understanding.

## 🛠️ Tech Stack
- **Framework:** React 18 (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Lucide Icons
- **Editor:** Lexical (Rich Text + Math support)
- **State/Routing:** React Router 6, Context API (Auth)

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env` file in the `client` directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_API_URL=http://localhost:3000/api
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

## 📂 Architecture Note
- `/src/components/app`: Core application layout and the custom Lexical editor.
- `/src/components/sidebar`: The main `InteractiveSidebar` logic that coordinates AI and notes.
- `/src/pages`: Main views including the responsive `Watchpage`.
