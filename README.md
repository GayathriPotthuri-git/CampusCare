# 🏛️ CampusCare — Campus Issue Management System

> A full-stack web application that streamlines campus issue reporting with AI assistance, real-time notifications, and role-based management.

🔗 **Live Demo:** [https://campuscare-33wv.onrender.com](https://campuscare-33wv.onrender.com)  
👩‍💻 **Built by:** [Gayathri Potthuri](https://github.com/GayathriPotthuri-git)

---

## 🚀 About the Project

CampusCare is a production-ready campus complaint management system that allows students and faculty to report issues directly to the right department — eliminating the need for manual follow-ups, paper complaints, or chasing authorities.

The system automatically routes complaints to the correct department authority, sends instant email and push notifications, and lets admins track and resolve issues from a centralized dashboard.

---

## ✨ Features

### 👤 Authentication
- Email/Password Signup & Login
- **Google OAuth 2.0** Single Sign-On
- Role-based access — Student, Faculty, Admin (auto-detected from email)
- Persistent sessions with secure token management

### 📝 Complaint Management
- Submit complaints across 6 categories — Electrical, Plumbing, Water, Network, Maintenance, Other
- **Auto-routing** — complaint is automatically assigned to the right department authority
- Real-time status tracking — Pending → In Progress → Resolved
- Visual **timeline tracker** on every complaint

### 📊 Admin Dashboard
- Live stats — Total, Pending, In Progress, Resolved
- **Bar chart** — complaints by category (Chart.js)
- **Doughnut chart** — status overview
- Filter complaints by status
- One-click status updates

### 🔔 Notifications
- **Instant email alerts** to department authority on new complaint (Nodemailer + Gmail)
- **Push notifications** via Firebase Cloud Messaging (FCM)
- Announcement push notifications to all users

### 🤖 AI Chatbot
- Powered by **Groq API (LLaMA 3.1)**
- Campus-restricted — only answers CampusCare related queries
- Structured responses with bullet points and emojis
- Guides users to report issues step by step

### 👤 Profile System
- Dropdown profile card on every page
- Editable profile — name, phone, roll number, department, bio
- Personal complaint stats in profile

### 📢 Announcements
- Admin can post campus-wide announcements
- Push notifications sent to all users on new announcement
- Categorized with tags

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Frontend** | HTML, CSS, JavaScript |
| **Authentication** | JWT Tokens, Google OAuth 2.0 (Passport.js) |
| **AI Chatbot** | Groq API (LLaMA 3.1-8b-instant) |
| **Email** | Nodemailer + Gmail SMTP |
| **Push Notifications** | Firebase Cloud Messaging (FCM) |
| **Charts** | Chart.js |
| **Deployment** | Render |
| **Version Control** | Git & GitHub |

---

## 📁 Project Structure

```
CampusCare/
├── server.js              # Express backend — routes, auth, notifications
├── package.json
├── env.example            # Environment variables template
└── public/
    ├── landing.html       # Landing page
    ├── login.html         # Login & Signup
    ├── index.html         # Report Issue form
    ├── dashboard.html     # Admin/User dashboard with charts
    ├── category.html      # Category-specific complaint page
    ├── authorities.html   # Department authorities listing
    ├── announcements.html # Campus announcements
    ├── app.js             # Core frontend logic
    ├── dashboard.js       # Dashboard charts & complaint management
    ├── profile.js         # Profile dropdown component
    ├── chatbot.js         # AI chatbot widget
    └── firebase-init.js   # Firebase push notification setup
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- A Gmail account (for email notifications)
- Firebase project (for push notifications)
- Google Cloud project (for OAuth)
- Groq API key (free at console.groq.com)

### Installation

```bash
# Clone the repo
git clone https://github.com/GayathriPotthuri-git/CampusCare.git
cd CampusCare

# Install dependencies
npm install

# Create .env file
cp env.example .env
# Fill in your keys in .env

# Start the server
nodemon --ignore "*.json" server.js
```

### Environment Variables

```env
GROQ_API_KEY=your_groq_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GMAIL_USER=your_gmail@gmail.com
GMAIL_PASS=your_gmail_app_password
FAST2SMS_API_KEY=your_fast2sms_key
PORT=3000
```

---

## 🔐 User Roles

| Role | Access |
|---|---|
| **Student** | Submit complaints, track own complaints, view announcements |
| **Faculty** | Submit complaints, track own complaints, view announcements |
| **Admin** | All of the above + manage all complaints, post announcements, view charts |

Role is **automatically detected** from email address on signup — no manual assignment needed.

---

## 📸 Pages Overview

| Page | Description |
|---|---|
| Landing | Hero page with animated category cards |
| Login/Signup | Auth with email or Google |
| Report Issue | Submit complaint — auto-routed to department |
| Dashboard | Stats, charts, complaint management |
| Authorities | Department heads with contact info |
| Announcements | Campus-wide notices |
| Chatbot | AI assistant for campus queries |

---

## 🌐 Deployment

This project is deployed on **Render** (free tier).

> Note: Free tier spins down after inactivity — first load may take 30-50 seconds.

Auto-deploys on every push to `main` branch via GitHub integration.

---

## 📬 Contact

**Gayathri Potthuri**  
📧 [GitHub](https://github.com/GayathriPotthuri-git)

---

⭐ If you found this project useful, consider giving it a star!