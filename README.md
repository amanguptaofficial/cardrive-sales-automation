# 🚗 CarDrive AI - Intelligent Lead Management System

An AI-powered lead management and sales automation platform designed for car dealerships. Automate lead scoring, routing, and communication to maximize conversions and streamline your sales process.

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Running the Application](#running-the-application)
- [Login Credentials](#login-credentials)
- [Project Structure](#project-structure)

## 🎯 Problem Statement

Car dealerships face several challenges in lead management:

- **Manual Lead Processing**: Time-consuming manual lead qualification and routing
- **Delayed Responses**: Slow response times lead to lost opportunities
- **Inefficient Routing**: Leads not properly prioritized based on intent and urgency
- **Poor Follow-up**: Lack of automated nurturing for cold leads
- **Limited Insights**: No real-time analytics on lead performance and agent productivity

## ✨ Solution

CarDrive AI solves these challenges by:

- **AI-Powered Lead Scoring**: Automatically scores leads (0-100) based on intent signals, budget, urgency, and engagement
- **Smart Routing**: HOT leads are instantly assigned to senior agents, while WARM/COLD leads enter automated nurture sequences
- **Instant AI Responses**: Generates personalized responses within 60 seconds using GPT-4o
- **Automated Drip Campaigns**: Nurtures cold leads with scheduled follow-up messages
- **Real-time Analytics**: Comprehensive dashboards for revenue, conversion rates, and agent performance
- **Multi-channel Communication**: WhatsApp, SMS, and Email support via Twilio and Resend

## 🚀 Key Features

### Lead Management
- **AI Lead Scoring**: Automatic scoring based on multiple signals (budget, urgency, model interest, etc.)
- **Smart Routing**: Automatic assignment based on lead tier (HOT/WARM/COLD)
- **Real-time Lead Queue**: Live updates via Socket.io
- **Lead Pipeline**: Visual tracking of lead progression stages

### AI Automation
- **AI Response Generation**: Personalized messages generated in seconds
- **Response Regeneration**: Multiple tone options (friendly, urgent, professional)
- **Drip Sequences**: Automated nurture campaigns for cold leads
- **AI Activity Log**: Track all AI actions in real-time

### Communication
- **Multi-channel Messaging**: WhatsApp, SMS, and Email
- **Internal Chat System**: Team collaboration with mentions and file sharing
- **Notification System**: Real-time alerts for new leads, mentions, and updates

### Analytics & Reporting
- **Revenue Analytics**: Track revenue by source, agent, and time period
- **Conversion Analytics**: Monitor conversion rates by tier, source, and agent
- **Agent Performance**: Individual and team performance metrics
- **Response Time Tracking**: Average response times and optimization insights

### Admin Features
- **User Management**: Create, verify, and manage agents
- **Integration Management**: Connect external lead sources (CarDekho, CarWale, etc.)
- **Bulk Operations**: Mass lead updates and assignments
- **Export Functionality**: Export data in multiple formats

## 🛠 Tech Stack

### Frontend
- **React 18**: Modern UI library
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Server state management
- **Socket.io Client**: Real-time communication
- **Recharts**: Data visualization

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **BullMQ**: Job queue management
- **Redis**: Caching and queue storage
- **Socket.io**: Real-time bidirectional communication

### AI & Services
- **OpenAI GPT-4o**: AI-powered lead scoring and response generation
- **Twilio**: WhatsApp and SMS messaging
- **Resend**: Email delivery service
- **Cloudflare R2**: File storage

## 📦 Prerequisites

Before setting up the project, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Redis** (local or cloud instance)
- **OpenAI API Key**
- **Twilio Account** (for WhatsApp/SMS)
- **Resend API Key** (for Email)

## 🏗 Local Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd AI-lead-Generation
```

### Step 2: Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp env.example.txt .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   REDIS_URL=your_redis_connection_string
   OPENAI_API_KEY=your_openai_api_key
   JWT_SECRET=your_jwt_secret
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   RESEND_API_KEY=your_resend_api_key
   FRONTEND_URL=http://localhost:5173
   PORT=5003
   ```

4. **Seed the database:**
   ```bash
   npm run seed
   ```
   
   This creates initial users:
   - Manager: `rahul@cardrive.in`
   - Senior Agent: `deepa@cardrive.in`
   - Senior Agent: `manoj@cardrive.in`
   
   All passwords: `password123`

### Step 3: Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp env.example.txt .env
   ```
   
   Edit `.env` and add:
   ```env
   VITE_API_URL=http://localhost:5003
   ```

## ▶️ Running the Application

### Start Backend Server

From the `backend` directory:

```bash
npm run dev
```

The backend server will start on `http://localhost:5003`

### Start Frontend Development Server

From the `frontend` directory:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 🔐 Login Credentials

After seeding the database, use these credentials to login:

### Manager Account (Full Access)
- **Email**: `rahul@cardrive.in`
- **Password**: `password123`
- **Access**: All features including admin panel, analytics, and user management

### Senior Agent Accounts
- **Email**: `deepa@cardrive.in` or `manoj@cardrive.in`
- **Password**: `password123`
- **Access**: Lead management, AI inbox, chat, and personal dashboard

## 📁 Project Structure

```
AI-lead-Generation/
├── backend/
│   ├── src/
│   │   ├── models/          # MongoDB schemas (Lead, Agent, Chat, etc.)
│   │   ├── controllers/     # Route handlers
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic (AI, messaging, etc.)
│   │   ├── workers/         # BullMQ background workers
│   │   ├── queues/          # Queue configurations
│   │   ├── config/          # Database, Redis, R2 configurations
│   │   ├── middleware/      # Authentication & validation
│   │   ├── enums/           # Constants and enums
│   │   ├── utils/           # Helper functions
│   │   └── scripts/         # Database seeding scripts
│   ├── .env                 # Environment variables (create from env.example.txt)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API and Socket services
│   │   ├── context/         # React Context providers
│   │   └── utils/           # Utility functions
│   ├── .env                 # Environment variables (create from env.example.txt)
│   └── package.json
│
└── README.md
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - Agent login
- `POST /api/auth/signup` - Agent signup
- `PATCH /api/auth/profile` - Update profile
- `PATCH /api/auth/password` - Change password

### Leads
- `GET /api/leads` - Get all leads (with filters)
- `POST /api/leads` - Create new lead
- `GET /api/leads/:id` - Get lead details
- `PATCH /api/leads/:id` - Update lead
- `POST /api/leads/bulk-update` - Bulk update leads

### AI
- `POST /api/ai/generate/:leadId` - Generate AI response
- `POST /api/ai/regenerate/:leadId` - Regenerate response with different tone
- `POST /api/ai/send/:leadId` - Send AI-generated message

### Dashboard
- `GET /api/dashboard/stats` - Dashboard KPIs
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/conversion` - Conversion analytics
- `GET /api/analytics/agent-performance` - Agent performance metrics

### Webhooks
- `POST /api/webhooks/website` - Website form submissions
- `POST /api/webhooks/cardekho` - CarDekho lead integration
- `POST /api/webhooks/carwale` - CarWale lead integration

## 📝 Notes

- Ensure MongoDB and Redis are running before starting the backend
- The seed script must be run before first login
- For production, update `FRONTEND_URL` and `PORT` in backend `.env`
- WhatsApp requires Twilio sandbox setup or verified business number

## 📄 License

MIT
