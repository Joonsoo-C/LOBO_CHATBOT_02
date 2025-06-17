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
- June 15, 2025. Fixed message sending functionality:
  * Resolved React Query v5 compatibility issues with onSuccess/onError callbacks
  * Fixed session cookie security settings for development environment
  * Added proper parameter validation to prevent database errors
  * Corrected route ordering to prevent NaN parsing issues
  * Message sending now works correctly with OpenAI integration
- June 15, 2025. Implemented separate conversation types:
  * Added conversation type field to database schema ("general" vs "management")
  * Created separate API endpoints for general and management conversations
  * Updated ChatInterface to support dual modes with different UI features
  * Added Management page with authorization checks for faculty users
  * General chat mode never shows management features, even for managers
  * Management chat mode provides full agent configuration capabilities
  * Each conversation type maintains completely separate message history
- June 16, 2025. Enhanced function selection feedback system:
  * Added system message functionality to provide immediate chat feedback
  * Function selections now trigger informative agent responses in chat
  * Implemented completion messages for persona editing and document uploads
  * Both initial guidance and success confirmation messages appear in conversation
  * Enhanced user experience with real-time feedback for all management functions
- June 16, 2025. Implemented comprehensive chatbot settings system:
  * Added LLM model selection (GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo)
  * Implemented three chatbot types with distinct behaviors:
    - strict-doc: Only document-based responses, rejects non-document questions
    - doc-fallback-llm: Prioritizes documents, falls back to general LLM when needed
    - general-llm: Free conversation with document context when available
  * Updated OpenAI integration to respect chatbot type settings
  * Added comprehensive validation and error handling for different response modes
- June 16, 2025. Implemented Adaptive Color Scheme Selector:
  * Created ThemeContext with support for light, dark, and system themes
  * Built ThemeSelector component with Korean language interface
  * Added theme switching capability across all pages (Home, Chat, Management, Auth)
  * Integrated system preference detection with automatic theme updates
  * Enhanced CSS with proper dark mode support and responsive design
  * Positioned theme selector in headers for easy access throughout the application
- June 16, 2025. Completed comprehensive notification system ("알림보내기"):
  * Implemented three-stage workflow: content input → approval confirmation → execution
  * Added simple, practical messaging without visual interface changes
  * Created approval system with "승인/취소" confirmation process
  * Notification system works seamlessly within management chat interface
  * All messages kept concise and practical per user preference
- June 16, 2025. Implemented real-time conversation list updates:
  * Added automatic polling every 3 seconds for conversation list refresh
  * Fixed message cache updates when new messages are sent or received
  * Improved broadcast notification system to immediately refresh conversation list
  * Enhanced unread count tracking with proper notification badges
  * Fixed TypeScript null safety issues in server-side conversation handling
  * Notification badges now correctly appear and disappear when visiting conversations
- June 17, 2025. Enhanced system message visual distinction:
  * Implemented comprehensive system message detection using multiple pattern matching approaches
  * Added distinct amber background styling for all system notifications and status messages
  * Created robust detection for Korean notification patterns (입니다, 됩니다, 결과, 기능, 추가 등)
  * System messages now consistently appear with visual indicators (🔧 prefix, ⚙️ icon, amber styling)
  * All administrative notifications, file uploads, and management responses properly styled
- June 17, 2025. Implemented custom image upload for agent icons:
  * Added complete image upload system with server-side endpoint and client-side UI
  * Supports JPG, PNG, GIF, WEBP formats with 5MB file size limit
  * Real-time image preview and validation with error handling
  * Database schema updated with is_custom_icon field for proper icon type tracking
  * AgentList, ChatInterface, and AgentManagement components support both standard and custom icons
  * Automatic fallback to default icons if custom images fail to load
- June 17, 2025. Enhanced mobile scroll behavior and UI positioning:
  * Implemented fixed headers with backdrop blur for better visual layering (later changed to opaque)
  * Added overscroll-behavior CSS to prevent scroll bouncing on iOS devices
  * Created proper z-index layering to prevent content showing behind headers
  * Added main-content padding to ensure content doesn't overlap with fixed headers
  * Improved touch scrolling with -webkit-overflow-scrolling for smoother performance
  * Applied consistent scroll improvements across Home, Chat, and Management pages
  * Fixed content overflow above header during fast scrolling with clip-path and masking
  * Removed backdrop blur per user request for completely opaque headers
  * Fixed dropdown menu z-index issues to prevent UI clipping
- June 17, 2025. Implemented agent category filtering system:
  * Added category filter dropdown in search bar with 6 options (전체, 학교, 교수, 학생, 그룹, 기능형)
  * Implemented dual filtering logic for both search query and category selection
  * Dynamic dropdown button text updates to show selected category
  * Category-only filtering when no search query is entered
  * Combined search and category filtering for refined results
- June 17, 2025. Implemented file list functionality in chat interface:
  * Added Files button to chat header for viewing uploaded documents
  * Created file list modal displaying document names and upload dates
  * Implemented file download functionality for all uploaded documents
  * Fixed filename display to show original names instead of hash strings
  * Added proper styling and responsive design for mobile devices
  * Fixed white box UI overlay issue by adjusting z-index values in CSS
  * Resolved modal background conflicts affecting both file list and upload modals
  * Restricted Files button to general chat mode only (hidden in management mode)
  * Added click-outside functionality to management dropdown menu
  * Repositioned notification badges to appear on the right side of message content line
- June 17, 2025. Implemented intelligent agent list sorting system:
  * Agents with recent messages appear at top sorted by most recent message receive time
  * Agents without messages maintain category order: 학교, 교수, 그룹, 학생, 기능형
  * Time information only displayed for agents with messages (empty for unused agents)
  * Dynamic real-time reordering when new messages are sent or received
  * Preserves initial category hierarchy while prioritizing message activity
- June 17, 2025. Implemented comprehensive responsive tablet UI design:
  * Added tablet-optimized layouts for Home, AgentList, and ChatInterface components
  * Home page uses grid layout on tablets with centered max-width container
  * Agent list displays in 2-3 column grid on tablet screens with larger cards
  * Chat interface becomes centered modal-style container with enhanced spacing
  * All text sizes, buttons, and spacing scale appropriately for tablet viewports
  * Fixed headers become static on tablet with proper border and background adjustments
  * Maintains full mobile functionality while providing enhanced tablet experience
- June 17, 2025. Implemented KakaoTalk-style two-panel tablet layout:
  * Created TabletLayout component with left agent list panel and right chat interface panel
  * Added useIsTablet hook for responsive breakpoint detection at 768px
  * Left panel (384px width) contains search, category filter, tab navigation, and agent list
  * Right panel shows selected agent's chat interface or management interface
  * Agent selection highlights with border and background color change
  * Automatic route handling for tablet vs mobile layouts in App.tsx
  * Proper icon rendering and category badges integrated from AgentList component
  * Empty state guidance when no agent is selected on tablet layout
- June 17, 2025. Enhanced tablet layout visual design:
  * Darkened left panel background (bg-muted/50) for better dropdown menu visibility
  * Added subtle background to right panel (bg-muted/30) for improved visual separation
  * Improved overall contrast and visual hierarchy in two-panel layout
  * Fixed ChatInterface layout flashing by adding tablet detection and conditional styling
  * Removed back button and fixed header behavior in tablet mode for seamless integration
  * Adjusted chat messages padding to prevent initial layout shifts
  * Implemented CSS-based media queries to prevent layout flash on tablet screens
  * Fixed message input positioning - static in tablet mode, fixed at bottom in mobile mode
  * Added chat-interface CSS classes for consistent tablet behavior
  * Improved useIsTablet hook with immediate window size detection
- June 17, 2025. Fixed logout functionality for local authentication system:
  * Identified system uses local auth (./auth) not Replit Auth (./replitAuth)
  * Fixed HTTP method mismatch: frontend was using GET, server expects POST
  * Updated logout mutation to use POST method with proper headers
  * Session destruction and cookie clearing already working correctly on server
  * Fixed both Home.tsx and TabletLayout.tsx logout implementations
  * Logout now properly clears session and redirects to /auth page
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```