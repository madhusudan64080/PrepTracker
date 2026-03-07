docker run -d --name redis-server -p 6379:6379 redis

🚀 PrepTrack — Placement Preparation OS



A full-stack platform designed to help students prepare for technical placements in a structured and measurable way.

PrepTrack acts like a personal operating system for placement preparation, combining learning management, coding practice tracking, analytics, revision systems, and AI-assisted study planning.

📌 Core Features
📚 Learning System

Subject and topic management

Structured preparation roadmap

Smart revision scheduling

Flashcards and quiz support

🧠 Smart Revision Engine

Spaced repetition system

Daily revision queue

Flashcard learning mode

Adaptive difficulty

💻 Coding Tracker

Log coding problems

Track platform (LeetCode, Codeforces, etc.)

Difficulty tagging

Progress tracking

🎯 Goal System

Daily learning targets

Problem-solving targets

Study time tracking

📊 Analytics Dashboard

GitHub-style progress heatmap

Topic mastery graphs

Problem solving metrics

Weekly performance reports

🔔 Smart Reminders

Evening reminder notifications

Daily goal tracking alerts

Revision reminders

⚡ Productivity Tools

Pomodoro focus timer

Command palette (Ctrl + K)

Global keyboard shortcuts

📱 Progressive Web App

Installable app

Offline support

Cached topics

Offline flashcard review

🔐 Authentication System

Secure JWT auth

Protected routes

Onboarding wizard

🧰 Tech Stack
Layer	Technology
Frontend	Next.js 14 (App Router)
Backend	Node.js + Express
Language	TypeScript
Database	MongoDB
Cache	Redis
Auth	JWT
AI	Gemini API
Deployment	Vercel + Railway
Containers	Docker
PWA	next-pwa
State	Zustand
UI	TailwindCSS
📦 Prerequisites

Before running PrepTrack locally you must install:

Node.js 20+

Docker

MongoDB Atlas account

Upstash Redis account

Gemini API Key

Vercel account

Railway account

🛠 Local Development Setup
1️⃣ Clone repository
git clone https://github.com/your-username/preptrack.git
cd preptrack
2️⃣ Install dependencies

Backend:

cd backend
npm install

Frontend:

cd frontend
npm install
3️⃣ Create environment variables

Copy example env files.

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

Fill the required values.

4️⃣ Start MongoDB and Redis
docker-compose up
5️⃣ Start backend server
cd backend
npm run dev

Server runs at:

http://localhost:5000
6️⃣ Start frontend server
cd frontend
npm run dev

App runs at:

http://localhost:3000
7️⃣ Open the app

Visit:

http://localhost:3000
🔑 Getting API Keys
Gemini API Key

Go to:

https://aistudio.google.com

Sign in with Google account

Click Get API Key

Create new key

Copy key into .env

MongoDB Atlas Setup

Visit

https://mongodb.com/atlas

Create free cluster

Create database user

Allow IP 0.0.0.0/0

Copy connection string

Upstash Redis Setup

Go to

https://upstash.com

Create Redis database

Copy Redis URL

🚀 Deployment Guide
Frontend → Vercel

Go to

https://vercel.com

Import GitHub repository

Select frontend folder

Set environment variables

Deploy

Backend → Railway

Visit

https://railway.app

Create project

Deploy from GitHub

Select backend folder

Add environment variables

Database → MongoDB Atlas

Use the cluster created earlier.

Redis → Upstash

Add Redis URL to environment variables.

🌍 Environment Variables
Name	Required	Description	Example
PORT	Yes	Backend port	5000
MONGO_URI	Yes	MongoDB connection string	mongodb+srv://...
REDIS_URL	Yes	Redis connection	redis://...
JWT_SECRET	Yes	JWT signing secret	randomsecret
GEMINI_API_KEY	Yes	Gemini AI key	AIza...
FRONTEND_URL	Yes	Allowed frontend origin	http://localhost:3000
📡 API Documentation
Auth
Method	Endpoint	Description	Auth
POST	/api/auth/register	Create account	❌
POST	/api/auth/login	Login	❌
GET	/api/auth/me	Get current user	✅
Subjects
Method	Endpoint
GET	/api/subjects
POST	/api/subjects
PUT	/api/subjects/:id
DELETE	/api/subjects/:id
Topics
Method	Endpoint
GET	/api/topics
POST	/api/topics
PUT	/api/topics/:id
🏗 Architecture
User
 │
 ▼
Next.js Frontend (Vercel)
 │
 ▼
Express API (Railway)
 │
 ├── MongoDB Atlas
 ├── Redis Cache
 └── Gemini AI API
🧯 Troubleshooting
1. MongoDB connection failed

Check connection string and whitelist IP.

2. Redis connection refused

Verify Redis URL and network access.

3. JWT errors

Ensure JWT_SECRET matches backend config.

4. CORS issues

Add frontend domain to backend CORS config.

5. Railway build failed

Ensure TypeScript compiles successfully.

6. Vercel build failed

Run locally:

npm run build
7. Service worker not registering

Ensure HTTPS environment.

8. Notifications not working

User must allow browser notifications.

9. API not reachable

Verify backend URL in frontend env.

10. Docker containers failing

Run:

docker-compose logs
📜 License

MIT License