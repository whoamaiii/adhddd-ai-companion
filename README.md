# ADHD Cleaning Companion

A web app that helps people with ADHD organize cleaning tasks through AI-powered image analysis and voice guidance. Features include task management, sensory tracking, and personalized insights.

## 🚀 Quick Start

**Prerequisites:** Node.js ≥ 20

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npm run dev
   ```

The app will run at `http://localhost:5173`

## 🤖 AI Features (Optional)

This app includes optional AI-powered features that require a Google Gemini API key:

- **Image Analysis**: Analyzes photos of messy spaces to generate cleaning tasks
- **AI Insights**: Provides personalized insights about your sensory patterns
- **Task Celebrations**: Generates encouraging messages when you complete tasks

### Setting up AI Features

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)

2. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Add your API key to `.env.local`:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

4. Restart the development server

**Note:** The app works perfectly fine without an API key. You'll see "Enable AI Insights" prompts where AI features would appear.

## 🛠️ Features

- **Task Management**: Break down cleaning tasks into manageable steps
- **Sensory Tracker**: Log and track sensory experiences and behaviors
- **Dashboard**: View trends and patterns in your sensory data
- **Timeline**: Review your sensory history over time
- **Voice Commands**: Optional voice control for hands-free operation

## 📁 Project Structure

```
├── components/          # React components
├── services/           # API and service integrations
├── types.ts           # TypeScript type definitions
├── constants.ts       # App constants and prompts
└── App.tsx            # Main application component
```
