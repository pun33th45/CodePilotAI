📘 CodeReview AI

AI-powered code review assistant built with React, TypeScript, Vite, and Google Gemini.

CodeReview AI provides automated insights on code quality, bug detection, and best-practice improvements using Google's Gemini AI model. Designed for developers who want fast, accurate, and contextual code reviews.

🚀 Features
🔍 Automated Code Review

Detects syntax errors

Suggests improvements

Highlights potential bugs

Recommends best practices

🤖 Powered by Google Gemini

Integrated with Google GenAI for accurate, context-aware code review.

🎨 Clean & Responsive UI

Built with React + TypeScript

Modern dashboard layout

Interactive code editor pane

Highlights code issues inline

⚡ Vite for Ultra-Fast Development

Superfast build and dev environment.

☁️ Fully Deployable on Vercel

Optimized for serverless deployment with easy environment variable support.

🛠️ Tech Stack
Layer	Tools
Frontend	React, TypeScript, Vite
AI Model	Google Gemini (Generative AI API)
Styling	CSS / Tailwind (if used)
Deployment	Vercel
State Mgmt	React Hooks
📂 Project Structure
codereview-ai/
│
├── components/          # Reusable UI components
├── pages/               # Main application pages
├── services/            # API and business logic (Gemini, GitHub, DB)
├── metadata.json        # App metadata
├── types.ts             # TypeScript interfaces & types
├── App.tsx              # Root app component
├── index.tsx            # App entry point
├── vite.config.ts       # Vite config
└── README.md            # Project documentation

🔧 Environment Variables

Create a .env file in the root:

VITE_API_KEY=your_google_gemini_api_key_here


Important: Variables MUST start with VITE_ to be exposed in a Vite app.

Never commit your .env file. Add it to .gitignore.

▶️ Running Locally
1. Install dependencies
npm install

2. Run the development server
npm run dev


This starts the app at:

http://localhost:3000

📦 Build for Production
npm run build


Outputs a production bundle inside the /dist folder.

☁️ Deploying to Vercel

Push your project to GitHub

Import the repo in Vercel

Add environment variable:

VITE_API_KEY=<your_key>


Deploy
Vercel will automatically detect your Vite setup.

🧠 How It Works (AI Logic Overview)

User pastes code in the editor

App sends the code & user preferences to Gemini

Gemini analyzes the input using a custom prompt:

Style enforcement

Bug detection

Code improvements

Best practice feedback

AI response is displayed with inline annotations

🛡️ Security Notes

API key is never stored client-side in the repository

Sensitive environment variables must remain in .env

Vercel securely injects them at build time

💡 Future Enhancements (Optional list for roadmap)

Integrate GitHub OAuth to review repository files

Add multi-language syntax support

Inline comment threading

Exportable review reports (PDF/MD)

Custom rules engine for linting
