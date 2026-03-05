# AI-Driven Learning Management System (LMS)

A modern, full-stack Learning Management System powered by AI to enhance the learning experience. This project features instructor and student dashboards, automated quiz generation, and integrated AI note-taking capabilities.

## 🚀 Features

- **Personalized Dashboards**: Distinct experiences for Students and Instructors.
- **AI-Powered Content**: Automated generation of quizzes and flashcards using Gemini/Cohere.
- **OAuth Integration**: Secure login via Google and GitHub.
- **Analytics**: Visual activity tracking for both students and instructors.
- **Course Management**: Full CRUD for courses, including video and document support.

## 🛠️ Project Structure

- `/frontend`: React + Vite application with Tailwind CSS and Recharts.
- `/backend`: Node.js + Express server with PostgreSQL and JWT authentication.

## 📦 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Recharts, Axios, Lucide React.
- **Backend**: Node.js, Express, PostgreSQL (pg), Passport.js (OAuth), JWT.
- **AI Integration**: Cohere API for content generation.

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running
- Cohere API Key (optional for AI features)

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`.
4. Run the database initialization scripts:
   - `node setup_courses_db.js`
   - `node setup_quizzes_db.js`
   - (and others as needed)
5. Start the server: `npm run dev`

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## 🔒 Security Note
Ensure that you never commit your `.env` file to a public repository. A `.env.example` has been provided for reference.
