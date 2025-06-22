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
  * Fixed chat container overflow and message input visibility issues
  * Added flex-shrink-0 and sticky positioning to ensure input area stays visible
  * Implemented proper height constraints to prevent unwanted scrolling beyond chat boundaries
  * Separated message input as fixed frame at screen bottom for mobile devices
  * Added CSS media queries for proper mobile vs tablet input positioning
  * Enhanced mobile UX with always-visible input UI regardless of content length
  * Removed chat room header information in tablet mode since left panel shows agent list
  * Simplified tablet UI by hiding redundant header when agent info is already displayed in sidebar
  * Fixed welcome message layout shifts by adjusting padding and adding CSS flex constraints
  * Welcome UI now appears consistently at top of chat area without jumping from center
  * Repositioned loading state to prevent center-to-top layout jumping during chat initialization
  * Loading spinner now appears at top position where welcome message will display
  * Removed loading state flash by showing welcome message immediately when no messages exist
  * Eliminated visual transition between loading spinner and welcome UI for smoother experience
  * Fixed blank screen issue after login by improving authentication state synchronization
  * Added proper query refetch and timing delay to ensure auth state updates before navigation
  * Fixed chat scroll behavior to immediately show most recent messages when entering chat rooms
  * Eliminated upward scrolling animation by using instant scroll positioning and DOM manipulation
  * Fixed agent personality isolation issue where changing one agent's speaking style affected all agents
  * Modified OpenAI prompt generation to respect individual agent personalities instead of global grumpy behavior
- June 17, 2025. Implemented tablet mode header controls:
  * Added TabletChatHeader component with file upload button for general chat mode
  * Integrated management dropdown menu with full functionality for admin mode
  * Header shows agent info, mode indicator, and appropriate action buttons
  * Files button opens document list modal in general chat mode
  * Management dropdown provides access to persona editing, icon changes, settings, and file uploads
  * Proper modal integration with system message feedback for all management functions
  * Added missing "계정 설정" (Account Settings) option to tablet mode settings dropdown menu
- June 17, 2025. Fixed logout functionality for local authentication system:
  * Identified system uses local auth (./auth) not Replit Auth (./replitAuth)
  * Fixed HTTP method mismatch: frontend was using GET, server expects POST
  * Updated logout mutation to use POST method with proper headers
  * Session destruction and cookie clearing already working correctly on server
  * Fixed both Home.tsx and TabletLayout.tsx logout implementations
  * Logout now properly clears session and redirects to /auth page
- June 18, 2025. Simplified mobile keyboard handling to standard browser behavior:
  * Removed all complex viewport manipulation and scroll blocking systems
  * Restored standard flex layout (display: flex, flex-direction: column, height: 100vh)
  * Eliminated position:fixed, Visual Viewport API, and aggressive scroll prevention
  * Chat interface now uses browser's natural keyboard behavior
  * Input area scrolls into view naturally when keyboard appears
  * Removed all JavaScript-based height calculations and CSS custom properties
  * Standard mobile web experience with header, scrollable messages, and input areas
- June 18, 2025. Rolled back keyboard UI fixes after repeated failures:
  * iPhone Chrome keyboard issues persist with header disappearing
  * Multiple attempted solutions (Visual Viewport API, fixed positioning, height manipulation) failed
  * Restored stable version with standard browser keyboard behavior
  * Keyboard UI improvements deferred for future implementation with different approach
- June 18, 2025. Implemented fixed header and input positioning for mobile:
  * Added position: fixed for header (top: 0) and input area (bottom: 0) on mobile
  * Set z-index: 1000 to ensure UI elements stay on top during scrolling
  * Adjusted message container padding to prevent content overlap with fixed elements
  * Fixed welcome message display issues by improving loading state handling
  * Resolved message UI flickering when entering conversations with few messages
- June 18, 2025. Added master account access button to login screen:
  * Added master account button alongside student and faculty demo account buttons
  * Master account button opens external admin system (https://university-ai-admin-hummings.replit.app/)
  * Opens in new tab for seamless admin system access without affecting main application session
- June 18, 2025. Improved demo account layout on login screen:
  * Changed from 2-column grid to 3 separate rows for better mobile readability
  * Applied consistent outline button styling to all three demo account options
  * All buttons now have full width with uniform spacing and text alignment
- June 20, 2025. Completed comprehensive multilingual support system:
  * Added LanguageContext with support for 5 languages: Korean, English, Chinese, Vietnamese, Japanese
  * Created LanguageSelector component with flag icons and dropdown interface
  * Integrated language selection in login screen settings dropdown
  * Implemented dynamic form validation with localized error messages
  * All UI elements now respond to language changes with proper translations
  * Language preference persists in localStorage across sessions
  * Updated all interface components to use translation system: TabletLayout, AgentManagement, ChatInterface
  * Translated all management functions: persona editing, icon changes, settings, notifications, document upload
  * Added multilingual support for category filtering, search placeholders, and empty state messages
  * Complete interface translation covers login, home, chat, and management screens
- June 20, 2025. Implemented intelligent multilingual AI response system:
  * Updated OpenAI system prompts to include language detection and response instructions
  * Modified generateChatResponse function to accept userLanguage parameter
  * Added language mapping for Korean, English, Chinese, Vietnamese, and Japanese AI responses
  * Updated chat message routes to pass user's language preference to OpenAI API
  * Enhanced ChatInterface to send user's selected language with every message
  * AI agents now automatically respond in the same language as the user's question
  * Language instruction integrated into all chatbot types: strict-doc, doc-fallback-llm, general-llm
  * System maintains agent personality while adapting to user's preferred language
- June 20, 2025. Fixed multilingual chat interface UI consistency:
  * Updated typing indicator to display language-appropriate text ("메시지 작성 중...", "Typing...", etc.)
  * Made message input placeholder multilingual to match selected language
  * Added chat.typing and chat.inputPlaceholder translation keys for all supported languages
  * Fixed language mismatch issue where AI responses and UI elements showed different languages
  * Complete UI/AI language synchronization now working across all interface elements
- June 20, 2025. Enhanced AI language response accuracy:
  * Restructured OpenAI system prompts to prioritize language instructions at the beginning
  * Fixed issue where AI responded in Korean despite user asking questions in other languages
  * Added multilingual "no documents" messages for strict-doc chatbot type
  * Strengthened language instruction with "CRITICAL LANGUAGE REQUIREMENT" directive
  * Converted Korean personality instructions to English to avoid language conflicts
  * AI now consistently responds in the user's selected language across all chatbot types
- June 20, 2025. Reverted to multilingual AI response system per user clarification:
  * Restored original functionality where AI responds in the same language as user's question
  * System now correctly detects user's selected language and responds accordingly
  * UI language and AI response language are synchronized again
  * Final rule: AI must respond in the language the user asks their question in
  * Supports Korean, English, Chinese, Vietnamese, and Japanese responses
- June 20, 2025. Fixed persistent language detection issues in AI responses:
  * Strengthened language instruction with "ABSOLUTE PRIORITY" directive to override Korean defaults
  * Added explicit "DO NOT USE KOREAN UNLESS SPECIFICALLY INSTRUCTED" rule
  * Fixed grumpy character system prompt that was forcing Korean responses with hardcoded examples
  * Created multilingual grumpy response examples for all supported languages
  * Ensured language instruction takes precedence over all personality and character instructions
  * Enhanced user message with explicit language enforcement and reminders
  * Added multilingual error message fallbacks for consistent language experience
  * Implemented double language instruction (system prompt + user message) for maximum compliance
- June 20, 2025. Fixed unread message badge notification system:
  * Prevented badge notifications when user is actively viewing conversation
  * Automatically mark conversations as read when user receives new messages while in chat
  * Optimized read status updates to only trigger when there are actually unread messages
  * Eliminated false notification badges during real-time chat conversations
- June 20, 2025. Fixed management mode message persistence issue:
  * User messages in management mode now properly saved to conversation history before triggering features
  * All management commands (페르소나, 챗봇 설정, 알림보내기, 문서 업로드, 성과 분석, 도움말) preserve user input
  * Fixed conversation history disappearing when leaving and returning to management chat rooms
  * Enhanced user experience with proper message flow: user message → system response → feature execution
- June 20, 2025. Implemented comprehensive message reaction system:
  * Added reaction UI for AI agent responses with toggle functionality (click same reaction to remove)
  * PC: Extended hover area across message and reaction UI to prevent flickering
  * Mobile: Tap message to show reaction options below message on left side
  * Two reaction options: 👍 Like, 👎 Dislike with circular button design
  * Reaction results display below message bubble on both PC and mobile platforms
  * Improved hover stability with 300ms delay and simplified event handling
  * Fixed positioning consistency between PC and mobile for unified user experience
  * Implemented database persistence with messageReactions table and API endpoints
  * Reactions now persist when leaving and re-entering chat rooms
  * Added proper reaction cancellation functionality (same icon click removes reaction)
  * Enhanced mobile display to match PC layout with reactions below message bubbles
- June 20, 2025. Fixed mobile layout and auto-scroll issues:
  * Increased mobile bottom padding from 120px to 140px to prevent message cutoff
  * Removed automatic scrolling behavior that moved screen without user interaction
  * Chat interface now only scrolls once when initially entering a conversation
  * Users maintain full control over scroll position during conversations
  * Fixed last message visibility on mobile devices with proper spacing for reactions
- June 20, 2025. Improved message text flow and readability:
  * Increased message container width from 75%/80% to 85% on both mobile and desktop
  * Enhanced Korean text typography with word-break: keep-all and overflow-wrap: anywhere
  * Added proper line-height and text wrapping controls to prevent premature line breaks
  * Improved text flow for longer messages to utilize full available width before wrapping
  * Fixed short message line breaking issue by implementing conditional text wrapping
  * Messages 20 characters or less display on single line with white-space: nowrap
  * Longer messages use natural wrapping with word-break: keep-all for Korean text
  * Applied width: fit-content for proper message bubble sizing
  * Fixed message overflow issues with max-width constraints and proper margin handling
  * Added automatic scroll to bottom when new messages are sent or received
  * Improved user message positioning with right margin to prevent screen edge cutoff
  * Fixed text alignment in user message bubbles by removing CSS class conflicts and using inline styles
  * Ensured all message text aligns to the left side of speech bubbles regardless of message length
  * Completely resolved text alignment issues through multiple comprehensive approaches
  * Overrode all Tailwind CSS text utility classes (text-center, text-right) to force left alignment
  * Applied @layer utilities CSS with highest specificity to override framework defaults
  * Added inline style attributes with textAlign: 'left' and direction: 'ltr' for absolute control
  * Wrapped message content in span elements with display: block and width: 100% for complete isolation
  * Messages 30 characters or less display on single line, longer messages wrap naturally with word-break: keep-all
  * Fixed both text alignment and line breaking issues with nuclear CSS override approach
- June 21, 2025. Implemented user message bubble consistent width system:
  * Added minimum width (100px) for user message bubbles to maintain visual consistency
  * Short messages (8 characters or less) display with fixed 120px width
  * Long messages automatically expand to fit content while respecting maximum width
  * CSS backup rules ensure consistent sizing across all user messages
- June 21, 2025. Enhanced tab navigation layout and sizing:
  * Changed from flex to grid grid-cols-2 layout for perfect 50:50 width distribution
  * Added tab-navigation CSS class with !important rules to override framework defaults
  * Mobile tabs: 56px height, 16px font size for better readability
  * PC/tablet tabs: 64px height, 18px font size for enhanced desktop experience
  * Full width implementation ensures tabs span entire container width
  * Applied consistent styling across Home.tsx and TabletLayout.tsx components
- June 21, 2025. Implemented comprehensive master administrator system:
  * Created master admin account (master_admin/MasterAdmin2024!) with admin user type
  * Built complete MasterAdmin.tsx page with system dashboard, user management, agent management, conversation monitoring, and system settings
  * Added admin.ts server module with protected API endpoints for master admin functions
  * Implemented system statistics, user/agent CRUD operations, and health monitoring
  * Added password visibility toggle with eye/eye-off icons in login form
  * Master admin automatically redirects to /master-admin page after login
  * Logout from admin page returns to login screen (/auth)
  * Admin dashboard includes real-time statistics, user activity, and system status monitoring
- June 21, 2025. Enhanced agent management with organizational hierarchy and icon customization:
  * Added agent manager assignment functionality with faculty user selection
  * Implemented organizational hierarchy system (university/graduate school → college → department)
  * Created organizations table with hierarchical relationships and sample data (로보대학교, 공과대학, 컴퓨터공학과 등)
  * Added 5 faculty accounts (prof001-003, dean001-002) for manager assignment
  * Made manager and organization selection mandatory for new agent creation
  * Implemented icon change functionality with modal interface matching existing chatbot design
  * Added icon change API endpoint with support for 10 different icons and 10 background colors
  * Agent creation now uses default icon/color, with separate icon customization available
  * Enhanced agent list display to show manager name and organizational affiliation
- June 22, 2025. Unified database system for LoBo AI chatbot and master admin system:
  * Confirmed both systems share the same PostgreSQL database through shared/schema.ts
  * Enhanced admin.ts with comprehensive agent statistics including document count, user count, and last used date
  * Improved agent management table with clickable rows, hover effects, and visual state indicators
  * Removed text-based active/inactive labels in favor of visual styling (background colors, text opacity)
  * Added proper error handling for database queries with fallback values
  * Master admin system now displays authentic data from the main chatbot database
  * Fixed main service button to open AI chatbot in new browser window
- June 22, 2025. Implemented accurate token usage visualization system:
  * Redesigned token usage trend graph with precise token type breakdown:
    - Input tokens (blue, 40-50% of total, bottom segment)
    - Output tokens (green, 15-24% of total, second segment)  
    - Index tokens (yellow, 15-20% of total, third segment)
    - Reading tokens (red, remaining percentage, top segment)
  * Updated all analysis periods (daily, weekly, monthly, overall) with realistic usage patterns
  * Daily view shows 60 days with weekend usage below 30%
  * Monthly view shows 12 months with vacation periods (Jan, Feb, July, Aug, Dec) below 30%
  * Added visual legend showing token types without percentage details
  * Implemented stacked bar chart visualization matching user's color specification
- June 22, 2025. Fixed PostgreSQL endpoint connectivity issues and completed SQLite migration:
  * Resolved "Control plane request failed: endpoint is disabled" error by migrating session storage from PostgreSQL to memory-based store
  * Successfully migrated database from disabled Neon PostgreSQL to SQLite for development
  * Fixed SQLite schema compatibility issues with timestamp functions and data binding
  * Created master admin account (master_admin/MasterAdmin2024!) and sample faculty accounts
  * System now fully operational with SQLite backend and memory session storage
  * All core functionality working: authentication, agent management, chat interface, admin panel
  * Master admin login successfully verified and dashboard accessible
  * Ready for agent creation and full system management through web interface
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```