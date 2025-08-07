# LoBo - University AI Chatbot System

## Overview
LoBo is a Korean university AI chatbot system designed to provide intelligent assistance to students and faculty through category-based agents. It features a modern React frontend with real-time chat, document analysis, and comprehensive agent management. The system is a full-stack TypeScript application, mobile-first, multilingual, and optimized for advanced document management. Its vision is to enhance university interaction, streamline information access, and provide personalized support, positioning it as a vital tool for modern educational institutions.

## User Preferences
Preferred communication style: Simple, everyday language.
Performance optimization priority: Fast startup and responsive UI.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI**: Radix UI with Tailwind CSS (mobile-first, responsive design, Apple Messages-inspired UI for chat and agent cards, consistent tab styling)
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Theming**: Adaptive color scheme selector (light, dark, system themes)
- **Internationalization**: Multilingual support (Korean, English) with dynamic UI and AI response translation.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Authentication**: Replit Auth (session-based)
- **File Processing**: Multer (DOC/PPT/TXT, 10MB limit)
- **AI Integration**: OpenAI GPT-4o (chat responses, document analysis, multilingual AI responses)
- **Performance**: Gzip compression, memory cache with TTL, asynchronous sample data initialization.

### Database
- **ORM**: Drizzle ORM (PostgreSQL dialect)
- **Database**: PostgreSQL (Neon serverless)
- **Session Storage**: PostgreSQL
- **Schema**: Supports users, agents, conversations, messages, documents, and organizations.

### Key Features
- **Agent System**: Categorized agents (School, Professor, Function, Department) with administrative management, custom icons, and background colors. Supports agent-specific conversations and contextual responses.
- **Chat Interface**: Real-time chat with message history, document integration, and mobile optimization. Includes reaction system (Like/Dislike), typing indicators, and message bubble styling.
- **Document Processing**: Supports TXT, DOC, DOCX, PPT, PPTX (50MB limit for general uploads, 5MB for icons). AI analysis for summarization and key point extraction. Documents linked to agents for contextual responses. Supports visibility and training toggles.
- **Authentication & Authorization**: Replit Auth, secure session management, role-based access control (Master Admin, Agent Manager, etc.), CSRF protection.
- **Master Admin System**: Comprehensive dashboard, user management (manual creation, bulk upload, role-based access), agent management (creation, bulk replacement, organization hierarchy, icon customization), conversation monitoring, document management (upload, download, delete, preview, visibility, training), Q&A logs, token management, system settings. Features organization category management via file upload.
- **Deployment**: Optimized for Replit autoscale deployment with robust configuration management.

## External Dependencies

### Core Services
- **OpenAI API**: GPT-4o model for AI chat and document analysis.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit Auth**: Authentication service.

### Development & Utilities
- **TypeScript**: Language.
- **Vite**: Frontend build tool.
- **ESBuild**: Server bundling.
- **Drizzle Kit**: Database migrations.
- **Tailwind CSS**: Styling framework.
- **Radix UI**: Accessible UI components.
- **Lucide React**: Icon library.
- **Date-fns**: Date formatting.
- **React Hook Form**: Form validation.
- **XLSX**: Excel file processing.