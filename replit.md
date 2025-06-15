# LoBo - University AI Chatbot System

## Overview

LoBo is a Korean university AI chatbot system that provides students and faculty with intelligent assistance through category-based agents. The system features a modern React frontend with real-time chat capabilities, document upload/analysis, and agent management functionality. It's built as a full-stack TypeScript application optimized for mobile-first usage.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Radix UI components with Tailwind CSS for responsive design
- **State Management**: TanStack Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First**: Responsive design optimized for mobile devices

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with session-based authentication
- **File Processing**: Multer for file uploads with support for DOC/PPT/TXT files
- **API Integration**: OpenAI GPT-4o for chat responses and document analysis

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless)
- **Session Storage**: PostgreSQL-based session store for authentication
- **Schema**: Comprehensive relational schema supporting users, agents, conversations, messages, and documents

## Key Components

### Agent System
- **Categories**: School (학교), Professor (교수), Function (기능), Department (학과)
- **Features**: Custom icons, background colors, activation status
- **Management**: Administrative interface for agent creation and configuration
- **Analytics**: Usage statistics and performance tracking

### Chat Interface
- **Real-time Messaging**: Conversation-based chat with message history
- **Document Integration**: File upload and analysis capabilities
- **Mobile Optimized**: Touch-friendly interface with gesture support
- **Context Aware**: Agent-specific conversations with persistent history

### Document Processing
- **Supported Formats**: TXT, DOC, DOCX, PPT, PPTX (10MB limit)
- **AI Analysis**: Automatic document summarization and key point extraction
- **Content Storage**: Full text indexing for search and retrieval
- **Agent Integration**: Documents linked to specific agents for contextual responses

### Authentication & Authorization
- **Replit Auth**: Integrated OAuth with automatic user provisioning
- **Session Management**: Secure session handling with PostgreSQL storage
- **Role-Based Access**: Agent management permissions for authorized users
- **CSRF Protection**: Built-in security measures for form submissions

## Data Flow

1. **User Authentication**: OAuth flow through Replit Auth creates user session
2. **Agent Selection**: Users browse categorized agents and initiate conversations
3. **Message Processing**: Chat messages processed through OpenAI API with context
4. **Document Upload**: Files analyzed by AI and stored with extracted metadata
5. **Response Generation**: AI generates contextual responses using agent personality and documents
6. **State Synchronization**: Real-time updates through TanStack Query cache invalidation

## External Dependencies

### Core Services
- **OpenAI API**: GPT-4o model for chat and document analysis
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Auth**: Authentication service integration

### Development Tools
- **TypeScript**: Type safety and enhanced developer experience
- **ESBuild**: Fast production bundling for server code
- **Drizzle Kit**: Database migrations and schema management
- **Tailwind CSS**: Utility-first styling framework

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library for consistent iconography
- **Date-fns**: Date formatting with Korean locale support
- **React Hook Form**: Form validation and handling

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with TypeScript compilation
- **Database**: Local PostgreSQL with connection pooling
- **File Storage**: Local filesystem with uploads directory
- **Environment**: Node.js 20 with ES module support

### Production Deployment
- **Build Process**: Vite production build + ESBuild server bundling
- **Database**: Neon serverless PostgreSQL with connection pooling
- **File Storage**: Server filesystem (uploads directory)
- **Scaling**: Replit autoscale deployment target
- **Port Configuration**: External port 80 mapping to internal port 5000

### Configuration Management
- **Environment Variables**: DATABASE_URL, OPENAI_API_KEY, SESSION_SECRET
- **Database Migrations**: Automated through Drizzle Kit
- **Asset Handling**: Static file serving for uploaded documents
- **Session Storage**: PostgreSQL-based with automatic cleanup

## Changelog

```
Changelog:
- June 15, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```