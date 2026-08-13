<div align="center">

# 🧠 AI Smart Study Planner

**A full-stack MERN application that turns your tasks and deadlines into an AI-generated, adaptive study schedule.**

Powered by **Llama 3.1** via the **Groq API**, it analyzes your courses, priorities, and time estimates to build an optimal daily plan — and explains its reasoning along the way.

![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Groq](https://img.shields.io/badge/AI-Groq%20%2F%20Llama%203.1-F55036)
![License](https://img.shields.io/badge/License-MIT-blue)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [API Architecture](#-backend--api-architecture)
- [Getting Started](#-getting-started-local-development)
- [Deployment](#-deployment-notes)

---

## 🚀 Overview

AI Smart Study Planner takes the guesswork out of scheduling. Instead of manually blocking out study time, users log their courses and tasks, and the AI generates a prioritized, day-by-day plan — factoring in urgency, workload, and deadlines — along with a clear explanation of *why* it structured the schedule that way.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Secure Authentication** | User registration and login with encrypted passwords (bcrypt) and JWT-based session management |
| 🤖 **AI-Powered Scheduling** | Groq API generates smart schedules, prioritizing high-urgency tasks without hardcoded logic |
| 📊 **Interactive Analytics** | Real-time stacked bar charts (Recharts) visualizing Completed vs. Pending vs. Missed hours |
| ✅ **Task & Course Management** | Full CRUD for courses and tasks, automatically linked to the logged-in user |
| 📱 **Responsive UI** | Tailwind CSS design that adapts seamlessly across desktop, tablet, and mobile |
| 🔔 **Toast Notifications** | Custom real-time success/error feedback, no native browser popups |

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="33%">

**Frontend**
- React.js (Vite)
- Tailwind CSS
- Recharts
- Axios

</td>
<td valign="top" width="33%">

**Backend**
- Node.js & Express.js
- MongoDB & Mongoose
- JWT & bcryptjs
- Groq API (Llama 3.1)

</td>
<td valign="top" width="33%">

**Deployment**
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

</td>
</tr>
</table>

---

## 🔐 Backend & API Architecture

The backend follows a standard MVC-style pattern with Express routers. All protected routes require a valid JWT passed via the `Authorization` header.

### Authentication — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Creates a new user and returns a JWT |
| `POST` | `/login` | Authenticates a user and returns a JWT |

### Courses — `/api/courses` 🔒
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Fetches all courses for the authenticated user |
| `POST` | `/` | Adds a new course |
| `DELETE` | `/:id` | Deletes a specific course |

### Tasks — `/api/tasks` 🔒
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Fetches all active tasks |
| `POST` | `/` | Creates a new task linked to a course |
| `PUT` | `/:id` | Updates task status |
| `DELETE` | `/:id` | Deletes a task |

### Schedule — `/api/schedule` 🔒
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Retrieves the user's current saved schedule |
| `POST` | `/generate` | **[AI Core]** Gathers tasks, builds a strict prompt, calls Groq Llama 3.1, parses the response, saves the schedule, and returns the plan + AI reasoning |
| `PUT` | `/:id` | Updates the status of a scheduled block (Completed / Pending / Missed) |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js installed
- MongoDB Atlas account
- Groq API key

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/smart-study-planner.git
cd smart-study-planner
```

### 2. Set up the backend
```bash
cd server
npm install
```

Create a `.env` file in `server/`:
```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GROQ_API_KEY=your_groq_api_key
FRONTEND_URL=http://localhost:5173
```

Start the server:
```bash
npm start
```

### 3. Set up the frontend
```bash
cd ../client
npm install
```

Create a `.env` file in `client/`:
```env
VITE_API_URL=http://localhost:8000
```

Start the Vite dev server:
```bash
npm run dev
```

---

## 🌐 Deployment Notes

This app is configured for easy deployment on free-tier hosting:

- **MongoDB Atlas** — Whitelist `0.0.0.0/0` in Network Access.
- **Render (Backend)** — Set root directory to `server`; add all backend environment variables.
- **Vercel (Frontend)** — Set root directory to `client`; set `VITE_API_URL` to the live Render URL. Update the Render `FRONTEND_URL` variable with the finalized Vercel domain to complete the CORS handshake.

---

<div align="center">

*Designed and developed as a portfolio piece showcasing full-stack development, AI integration, and modern UI/UX principles.*

</div>