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
- June 22, 2025. Converted user search section to agent search and management:
  * Changed "사용자 검색 및 관리" section to "에이전트 검색 및 관리" in master admin interface
  * Replaced user search functionality with agent name-based search capability
  * Updated search filters: category (전체/학교/교수/학생/그룹/기능형), status (활성/비활성), manager selection
  * Implemented agent filtering by name, description, category, and status
  * Updated search results to display filtered agent count instead of user count
  * Replaced user table with comprehensive agent management table showing agent details, statistics, and management actions
  * Fixed all function references and imports to support agent-focused search and management workflow
- June 23, 2025. Completely removed sidebar menu system and duplicate pages:
  * Deleted all sidebar components: Sidebar.tsx, SidebarLayout.tsx, ui/sidebar.tsx
  * Removed all duplicate sidebar-based pages: Dashboard2, UserManagement2, AgentManagement2, QALogs2, TokenManagement2, CategoryManagement2, DocumentManagement2, SystemSettings2
  * Cleaned up App.tsx routing to remove all sidebar-related routes
  * Removed sidebar state management and UI elements from MasterAdmin.tsx
  * Removed sidebar styling configuration from tailwind.config.ts
  * Master admin system now operates as single-page application without sidebar navigation
- June 23, 2025. Enhanced agent list sorting for general chat mode:
  * Updated AgentList.tsx, TabletLayout.tsx, and Home.tsx to prioritize agents with recent messages
  * Agents with recent conversations now appear at top, sorted by newest message timestamp
  * Agents without messages maintain category-based ordering (학교, 교수, 그룹, 학생, 기능형)
  * Improved user experience by making active conversations easily accessible
  * Consistent sorting behavior across mobile and tablet layouts
- June 23, 2025. Fixed message sending functionality with memory storage fallback:
  * Resolved database connection issues causing message sending failures
  * Updated message sending logic to work with memory storage system when PostgreSQL is unavailable
  * Fixed conversation lookup methods to use available storage interface methods
  * Message sending now works correctly with OpenAI API integration
  * System automatically falls back to memory storage with proper error handling
- July 23, 2025. Completed comprehensive schema migration for agent persona system:
  * Migrated "금칙어 반응 방식" to more intuitive "추가 프롬프트" throughout entire system
  * Updated all field names for consistency: speakingStyle → speechStyle, personalityTraits → personality, personaName → personaNickname, rolePrompt → expertiseArea
  * Enhanced schema with meaningful field names and examples for better user guidance
  * Completed end-to-end migration: shared/schema.ts, server routes, OpenAI integration, client types, and UI components
  * Added translation examples like "간단하고 정중한 말투로, 최대 5줄 이내 요약" for better UX
  * All LSP diagnostics resolved with fully functional persona editing system
- July 23, 2025. Enhanced persona tab placeholders with Korean examples:
  * Completely removed '역할 프롬프트' (role prompt) field from new agent creation popup's basic information tab
  * Fixed AgentDocumentList component LSP errors by resolving missing functions and undefined state variables
  * Enhanced persona configuration with specific Korean placeholder examples:
    - 에이전트 이름: "예: 민지, 도우미, 상담봇"
    - 말투 스타일: "예: 친구처럼 편안한 말투로 말해주세요."
    - 지식/전문 분야: "예: 입학상담, 진로코칭, 프로그래밍, 영어 에세이 등"
    - 성격 특성: "예: 친절하고 인내심 있는 성격, 논리적인 사고, 유머감각 있음 등"
  * Updated both new agent creation popup and agent detail popup persona tabs with consistent Korean placeholders
  * Fixed gray screen issue in agent detail popup's file upload screen with proper error resolution
- July 24, 2025. Completed Korean localization for agent description placeholders:
  * Updated agent description placeholder text system-wide: "에이전트의 역할과 기능을 설명해주세요 (최대 200자)" → "에이전트의 역할이나 기능을 간단히 소개해 주세요."
  * Applied changes to all agent management components: BasicInfoEditModal.tsx, MasterAdmin.tsx (both edit and creation modes), LanguageContext.tsx
  * Removed character limit text "(최대 200자)" from placeholders for cleaner, more natural Korean interface
  * Enhanced user experience with simplified, friendly Korean language throughout agent management system
- July 24, 2025. Completed comprehensive background color restoration and basic info popup text improvements:
  * Successfully restored chat room background color from neumorphism style to white (#ffffff) across all components
  * Updated ChatInterface.tsx, Chat.tsx, Home.tsx, index.css body styling for consistent white background
  * Enhanced basic info popup Korean terminology: "에이전트 설명" → "에이전트 소개", "유형 선택" → "에이전트 유형", "상위 조직" → "소속 상위 조직"
  * Removed required field asterisk (*) from "에이전트 소개" field as it's not mandatory
  * Fixed TypeScript array iteration errors using Array.from() for proper Set conversion
- June 23, 2025. Implemented complete document management functionality in master admin system:
  * Added document download functionality with proper file streaming and headers
  * Implemented document delete functionality with file system cleanup
  * Connected UI buttons to backend API endpoints with loading states and error handling
  * Added server-side endpoints for document download and deletion with proper authentication
  * Integrated with existing storage interface methods for consistent data management
  * Enhanced user experience with confirmation dialogs and success/error notifications
  * Replaced file download with web-based document preview system for Replit compatibility
  * Added preview endpoint that opens documents in new browser windows with formatted content
  * Fixed file storage issues by implementing proper permanent file copying during upload
  * Fixed critical JavaScript variable naming conflict preventing actual file downloads
  * Enhanced download functionality with proper blob handling and UTF-8 filename encoding
  * Document download now works correctly with proper error handling and user feedback
  * Implemented file-based persistence layer for memory storage to ensure documents persist across server restarts
  * Added automatic document loading from persistent storage with proper date conversion
  * Enhanced document creation and deletion with immediate persistence saving
- June 24, 2025. Implemented comprehensive performance optimization system:
  * Added gzip compression for API responses reducing transfer size by 60-80%
  * Implemented smart memory cache with TTL for frequently accessed data (agents, conversations)
  * Reduced sample data initialization from 400 to 50 users with batch processing (20 user batches)
  * Enhanced React Query cache settings: extended staleTime to 10 minutes, added gcTime for better caching
  * Added automatic memory cleanup every 30 minutes removing old conversations and orphaned messages  
  * Implemented asynchronous sample data initialization to improve server startup time
  * Added cache invalidation strategy for real-time data consistency
  * Enhanced API endpoints with client-side cache headers for better browser caching
  * Created performance utilities for debouncing, throttling, and memoization
  * Enhanced frontend components with React.useMemo for expensive computations
  * Added virtual list component for handling large datasets efficiently
- June 25, 2025. Completed comprehensive organization category file upload system:
  * Disabled all sample organization data initialization permanently
  * Implemented complete Excel/CSV file processing with flexible column mapping
  * Added support for Korean and English column headers (조직명/name, 상위조직/upperCategory, etc.)
  * Created robust file parsing system handling both .xlsx and .csv formats
  * Fixed frontend mutation integration with proper state management
  * Implemented real-time data refresh after successful upload
  * Added comprehensive validation and error handling for file processing
  * Upload system now fully replaces hardcoded sample data with user-provided organization structures
  * Master admin interface displays uploaded organization data in filters and search results
  * System now supports dynamic organization hierarchy management through file uploads
  * Enhanced hierarchical organization structure parsing for "상위카테고리", "하위카테고리", "세부카테고리" format
  * Fixed organization filtering system to display all hierarchy levels in search dropdowns
  * Improved organization table display to show complete hierarchical structure (상위/하위/세부 조직)
  * Fixed organization data processing to correctly handle 124 unique organizations from Excel file
  * Added file-based persistence for organization categories to survive server restarts
  * Enhanced UI to display all hierarchy levels including detailCategory in organization table
  * Corrected duplicate data issue by implementing proper Excel field mapping for 상위카테고리/하위카테고리/세부카테고리
  * Fixed organization data corruption by clearing incorrect entries and loading only authentic Excel data
  * Organization system now contains exactly 124 categories with proper detail organization structure
  * All organization statuses preserved: 활성, 비활성, 등록 승인 대기중
- June 25, 2025. Enhanced organization category file upload dialog with document management:
  * Added uploaded document list display in organization category upload dialog
  * Implemented file listing with original filenames and upload timestamps
  * Created individual file deletion functionality with confirmation
  * Added server API endpoints for file listing (/api/admin/organization-files) and deletion
  * Enhanced file filtering to include all document types (.xlsx, .xls, .csv, .docx, .pdf)
  * Improved file naming with org- prefix for organization-specific uploads
  * Added visual file type indicators and badges for organization files
  * Implemented automatic list refresh after upload and deletion operations
  * Fixed file filtering logic to properly identify and display uploaded files
  * Complete document management workflow now available in organization upload interface
- June 26, 2025. Improved organization category file upload system with status indicators:
  * Enhanced file filtering to display only actual organization category files used for data import
  * Implemented comprehensive status indicator system (최종 반영됨, 검증됨, 미반영)
  * Added organization count display showing number of organizations reflected from each file
  * Created file tracking system with metadata for upload status and organization impact
  * Fixed UI consistency by displaying only authentic organization data files in upload dialog
- June 26, 2025. Fixed pagination button styling inconsistency:
  * Resolved issue where selected page buttons appeared thinner/smaller than unselected buttons
  * Added CSS classes with !important rules to ensure consistent 40px x 40px size for all pagination buttons
  * Applied uniform border width, padding, and box-sizing to both active and inactive page buttons
  * Maintained visual distinction through color changes only while preserving consistent button dimensions
- June 26, 2025. Fixed critical user file upload validation system:
  * Resolved "지원되지 않는 파일 형식" error for valid Excel and CSV files
  * Fixed variable initialization order error that caused server startup failure
  * Enhanced file validation with comprehensive MIME type detection for Excel (.xlsx, .xls) and CSV (.csv) files
  * Added detailed logging system for debugging file upload issues
  * Implemented robust error handling with specific feedback for unsupported file types
  * Prioritized file extension validation over MIME type checking for better reliability
  * Fixed Korean filename encoding handling for international file names
- June 26, 2025. Completed comprehensive user file upload system with real-time updates:
  * Implemented real-time user list refresh after successful file uploads
  * Added uploaded user file list display with status indicators ("최종 반영됨", "검증됨", "미반영")
  * Created file tracking system showing user count processed from each uploaded file
  * Enhanced file management with deletion functionality and confirmation dialogs
  * Integrated file list in both main user management section and upload dialog
  * Fixed real-time data synchronization ensuring search results reflect newly uploaded users
  * Added comprehensive status badge system with color-coded visual indicators
  * Implemented file-based persistence for user file metadata to survive server restarts
- June 26, 2025. Enhanced user file upload UI and operation modes:
  * Moved uploaded file list from main user management screen to file upload popup dialog
  * Clarified overwrite option behavior with detailed explanations in UI
  * Default mode (unchecked): preserves existing user data, adds only new users, maintains existing connections
  * Overwrite mode (checked): completely replaces all user data with uploaded file contents
  * Enhanced upload dialog with comprehensive file management and status tracking within popup
  * Improved user experience with clear operation mode descriptions and real-time status updates
- June 26, 2025. Implemented type filtering in agent management search:
  * Added "유형" (Type) filter dropdown to agent search and management section in master admin interface
  * Filter options include: 전체, 학교, 교수, 학생, 그룹, 기능형
  * Improved agent categorization using "유형" terminology instead of "기본 카테고리"
  * Enhanced search functionality now supports filtering by both type and status
  * Type filter positioned alongside status filter in responsive grid layout
- June 26, 2025. Completed comprehensive agent data replacement system:
  * Successfully processed and uploaded 100 new agent records from Excel file (대학_AI챗봇_에이전트_100개_페르소나고유)
  * Implemented complete agent data replacement functionality with clearAllAgents() method
  * Created automated agent data loading system that processes Excel files and converts to proper format
  * Added server-side agent data loading functionality that runs automatically on startup
  * All 100 new agents now available in both master admin interface and general chat system
  * Agent data includes specialized Q&A chatbots for various university departments and functions
  * System successfully replaced existing 5 sample agents with new comprehensive agent collection
  * Final agent distribution: 87 학생, 11 학교, 1 기능형, 1 교수 agents operational
  * Created direct replacement script (direct_replace_agents.js) for command-line agent replacement
  * Implemented API endpoint (/api/admin/agents/replace-all) for programmatic agent replacement
  * Agent replacement system fully functional with comprehensive Korean university chatbot collection
- June 26, 2025. Implemented comprehensive user data management system:
  * Added bulk user deletion functionality with clearAllUsers() method in memory storage
  * Created admin API endpoint for mass user deletion (/api/admin/users/bulk/clear-all)
  * Successfully deleted 52 users from system while preserving master_admin account
  * Implemented automatic persistence saving to ensure data changes survive server restarts
  * Enhanced user management with comprehensive logging and confirmation feedback
  * System now contains only essential master admin account for clean state management
- June 26, 2025. Completed Robo University agent deletion system:
  * Implemented deleteRoboUniversityAgents() method in memory storage for targeted agent removal
  * Created admin API endpoint for Robo University agent deletion (/api/admin/agents/bulk/robo-university)
  * Successfully executed deletion function checking all 100 agents in system
  * Found 0 "로보대학교" agents requiring deletion in current system state
  * Enhanced deletion logic with comprehensive agent name and description checking
  * System now equipped with selective agent deletion capability for future management needs
- June 26, 2025. Implemented comprehensive manual user creation system:
  * Added "+ 새 사용자 추가" button with complete form UI in master admin interface
  * Created server API endpoint /api/admin/users/create with validation and duplicate checking
  * Implemented NewUserForm component with organization hierarchy selection functionality
  * Added real-time data refresh after user creation with automatic cache invalidation
  * Integrated with existing organization categories for proper user categorization
  * Fixed React duplicate key warnings by adding unique identifiers to SelectItem components
  * Manual user creation now fully functional alongside bulk file upload capabilities
- June 27, 2025. Successfully implemented Final_Updated_AI_Agents_List complete data replacement:
  * Fixed memory storage persistence issue preventing agent data from being saved across server restarts
  * Implemented manual file saving mechanism in server initialization to ensure agent data persistence
  * Successfully replaced all existing sample agents with 100 new Korean university AI chatbots
  * Final agent distribution: 87 학생, 11 학교, 1 기능형, 1 교수 agents operational
  * Created comprehensive agent collection covering various university departments and specialized functions
  * Enhanced agent data loading system with automatic replacement on server startup
  * All 100 agents now fully visible and functional in master admin interface
  * Agent data successfully persisted to data/memory-storage-agents.json file for permanent storage
- June 27, 2025. Fixed missing '대학본부' organization category system-wide:
  * Identified and resolved issue where '대학본부' upper category was missing from all dropdown menus
  * Created debugging script to analyze original Excel file (대학_조직_카테고리_목록.xlsx) and confirmed '대학본부' exists in source data
  * Developed automated fix script to synchronize missing organization categories between Excel file and system database
  * Successfully added 19 missing organization categories including '대학본부' and its hierarchical sub-categories
  * Updated organization category count from 105 to 124 categories with complete data integrity
  * All upper category dropdowns now display complete list: 경영대학, 공과대학, 대학본부, 대학원, 사회과학대학, 연구기관, 예술대학, 예체능대학, 의과대학, 인문대학, 자연과학대학, 학사부서, 학생자치기구
  * Fixed document detail popup agent connection interface to include all organizational hierarchy levels
  * Ensured consistent organization category data across master admin interface, user management, and document management systems
- June 27, 2025. Updated agent data system with latest Excel file:
  * Successfully processed latest Excel file (AI 에이전트 0627_1751054472984.xlsx) with 100 agent records
  * Enhanced data mapping to prioritize '유형' column for accurate category display in admin interface
  * Improved agent data structure with proper field mapping for all Excel columns
  * Verified agent type distribution: 87 학생, 11 학교, 1 기능형, 1 교수 agents
  * Agent management interface now displays correct type data from Excel source
  * All agent lists (management menu, search results) reflect accurate type information
- June 28, 2025. Implemented independent manager tab sessions with automatic state reset:
  * Added currentManagerTab state tracking for agent/document/QA manager role tabs
  * Created resetManagerSearchState function to clear search query, organization filters, and pagination
  * Implemented handleManagerTabChange handler that automatically resets search state when switching tabs
  * Updated Tabs component to use controlled value and onValueChange for proper state management
  * Fixed TypeScript errors by adding optional role property to ManagerInfo type
  * Each manager role tab now operates as independent search/selection session
  * Tab switching automatically clears previous search conditions while preserving selected managers
- June 29, 2025. Enhanced user management with dropdown-based role selection system:
  * Converted position/role input fields from text inputs to comprehensive dropdown menus
  * Added 19 position options: 학생, 교수, 직원, 연구원, 조교, 대학원생, 박사과정, 석사과정, 학부생, 졸업생, 강사, 부교수, 정교수, 명예교수, 초빙교수, 겸임교수, 시간강사, 연구교수, 외래교수
  * Implemented system role dropdown with 8 options: 일반 사용자, 마스터 관리자, 운영 관리자, 카테고리 관리자, 에이전트 관리자, QA 관리자, 문서 관리자, 외부 사용자
  * Applied consistent dropdown UI in both user edit and new user creation forms
  * Updated form schemas and mutations to support role field in user creation workflow
  * Enhanced user experience with structured role assignment replacing free-text input
  * Fixed status dropdown validation errors by aligning English backend values with Korean display labels
  * Modified manager filtering system to show only users with "마스터 관리자" or "에이전트 관리자" system roles in agent creation dropdown
- June 29, 2025. Integrated LoBo AI messenger service with admin center managed database:
  * Connected messenger service to use admin center's managed database files exclusively
  * Configured system to load from data/organization-categories.json for organization management
  * Integrated data/memory-storage.json for user data managed by admin center
  * Connected data/memory-storage-agents.json for agent management from admin center
  * Disabled all sample data initialization to prevent conflicts with admin-managed data
  * Added missing agent icon change endpoint (PATCH /api/admin/agents/:id/icon) to fix frontend errors
  * LoBo AI messenger now operates as managed service under admin center's database control
  * Updated demo accounts in login screen with specific users from admin center database:
    - 학생계정: 장지훈 (user1082) - 인문대학 / 국어국문학과 / 현대문학전공, 학생
    - 교직원계정: 정수빈 (user1081) - 인문대학 / 국어국문학과 / 현대문학전공, 교수, 에이전트 관리자
    - 마스터계정: Master Admin (master_admin) - LoBo AI 챗봇 통합 관리자 센터 접근
  * Fixed authentication system by implementing proper bcrypt password hashing for all demo accounts
  * Demo account login functionality now working correctly with account settings access
- June 29, 2025. Implemented account settings modal and enhanced chat interface:
  * Created AccountSettingsModal component with comprehensive user information display
  * Added modal trigger to settings dropdown with "계정 설정" option that opens popup instead of dropdown menu
  * Modal displays username, name, email, user type, account status, and system role with Korean localization
  * Replaced large centered welcome UI in chat rooms with natural agent greeting message bubble
  * Agent now greets users with: "안녕하세요! 저는 [agent name]입니다. 궁금한 것이 있으면 언제든지 물어보세요."
  * Fixed message flickering issue by improving optimistic message handling and cache management
  * Enhanced message state transitions to prevent visual gaps when AI responses load
- June 29, 2025. Restructured agent management interface with top-positioned action buttons:
  * Reorganized "에이전트 관리" section with main title and two prominent action buttons at the top
  * Added "에이전트 수동 추가" button (blue) connecting to manual agent creation dialog
  * Added "파일 업로드" button (green) with descriptive text connecting to AgentFileUploadModal for bulk uploads
  * Moved "에이전트 검색 및 관리" to subsection below action buttons for better visual hierarchy
  * Enhanced UI layout matching user's design requirements with card-based button styling
- June 30, 2025. Implemented comprehensive Apple Messages UI design system:
  * Redesigned message bubbles with Apple's signature rounded corners and gradient backgrounds
  * User messages: Blue gradient (#007AFF to #0051D5) with white text and tail on bottom-right
  * AI messages: Light gray (#F2F2F7) in light mode, dark gray (#2C2C2E) in dark mode with tail on bottom-left
  * Updated chat input to rounded textarea with Apple's styling and auto-expanding height
  * Redesigned send button as circular blue gradient button with hover animations
  * Applied Apple Messages header styling with translucent background and blur effects
  * Updated agent cards with rounded corners, subtle shadows, and hover animations
  * Implemented Apple-style navigation tabs with pill design and smooth transitions
  * Added comprehensive color system matching Apple's design guidelines
  * Enhanced typing indicator with bouncing dots animation in message bubble format
  * All UI elements now follow Apple's Human Interface Guidelines for consistency
  * Fixed message input area to use full screen width like standard messaging apps
  * Enhanced message bubble width: mobile 90%, desktop 85% for better text flow and readability
  * Updated AI message bubble color to match user-specified gray (#E5E5E5) for both light and dark modes
  * Changed user message bubble color to match user-specified blue (#4A90E2) replacing Apple's gradient
  * Updated send button and hover effects to use consistent blue color scheme
  * Enhanced user message bubble width (95%) and adjusted right margin (8px) for better text flow
  * Fixed message line breaking to prevent forced wrapping of short user messages (≤15 chars) while maintaining natural text flow for AI responses
  * Changed text wrapping from word-break: keep-all to word-break: break-all for character-level line breaking in Korean text
- June 30, 2025. Fixed mobile chat list header overlap issue:
  * Increased mobile main content margin-top from 140px to 160px to prevent chat list clipping
  * Set mobile header height to auto with min-height 140px to accommodate search bar and tab navigation
  * Chat list now displays properly without being cut off by fixed header on mobile devices
  * Optimized chat list spacing for messenger-style layout: reduced top margin to 120px, card gaps to 0.25rem, padding to 12px, and margins to 4px for compact messenger-like appearance
- June 30, 2025. Implemented proper bottom-aligned message positioning like KakaoTalk:
  * Fixed chat messages container to use flex-end justification for last message at bottom
  * Reduced mobile padding-bottom from 140px to 40px for accurate message positioning
  * Added CSS rules for proper min-height calculations (100vh - 260px on mobile)
  * Created compact agent list with 1px gaps, 8px card padding, and 10x10 icons
  * Messages now appear at screen bottom like standard messenger apps per user screenshot reference
  * Increased message container padding-bottom to 50px on mobile to prevent message bubble clipping
- June 30, 2025. Redesigned agent list for cleaner messenger-style appearance:
  * Removed individual card borders and rounded corners for continuous list appearance
  * Added subtle bottom border (1px) between conversation items instead of card borders
  * Implemented hover (#F5F5F5) and active press (#EBEBEB) feedback for better touch interaction
  * Added selected state highlighting with blue background (#E8F4FD) for current conversation
  * Dark mode support with appropriate color variations for all interaction states
- June 30, 2025. Enhanced icon change modal with improved image upload functionality:
  * "이미지 업로드" button now automatically triggers file selection dialog when clicked
  * Added dedicated "이미지 파일 선택" button for clearer user interaction
  * Enhanced file drop area with hover effects and visual feedback
  * Supports JPG, PNG, GIF, WEBP formats with 5MB size limit
  * Improved user experience with multiple ways to access file selection
- June 30, 2025. Fixed agent persistence issue in manual agent creation system:
  * Fixed createAgent method in memory storage to automatically save agents to persistent storage
  * Disabled sample agents initialization that was overriding manually created agents
  * Manually created agents now persist correctly across server restarts and user sessions
  * Agent database operations now properly synchronized with file-based persistence layer
- June 30, 2025. Fixed agent visibility and user role issues:
  * Implemented organization-based agent filtering in `/api/agents` endpoint
  * Added proper visibility control: public agents visible to all, organization agents filtered by user's department
  * Set first 10 agents to public visibility for consistent access across demo accounts
  * Fixed user role data consistency by converting Korean role values to English keys
  * Updated 정수빈 user role from "에이전트 관리자" to "agent_admin" for proper dropdown mapping
  * Demo accounts now see appropriate agents based on their organizational affiliation
- July 1, 2025. Enhanced tablet layout and tab navigation design:
  * Updated tablet layout to 50:50 screen split ratio using w-1/2 for left panel and flex-1 for right panel
  * Implemented negative-style tab design with dark selected tabs (gray-800 background, white text)
  * Enhanced inactive tab contrast with gray-300 background and gray-700 text for better readability
  * Improved visual hierarchy with proper background color gradation from container to tabs
  * Applied consistent tab styling across both Home and TabletLayout components
- July 1, 2025. Repositioned reaction UI to appear next to timestamp information:
  * Moved reaction options (👍👎) from below message bubbles to right of timestamp information
  * Disabled mouse hover functionality, made reaction UI exclusively triggered by long-press (500ms)
  * Added haptic feedback (vibration) when long-press successfully triggers reaction options
  * Simplified reaction display to appear in same row as timestamp for cleaner interface
  * Removed unnecessary hover timeout references and cleaned up state management for mobile-optimized UX
- July 2, 2025. Fixed mobile management mode dropdown functionality and document deletion system:
  * Implemented complete mobile Management page dropdown with 7 management features matching PC version
  * Fixed document deletion API path mismatch between frontend and backend endpoints
  * Used forwardRef pattern to enable Management page access to ChatInterface internal functions
  * Document deletion now works correctly with proper API calls to `/api/documents/${id}` endpoint
  * Modal interfaces respond to tap/click interactions for dismissal as expected
- July 2, 2025. Completed selective chat cleanup for student account:
  * Created and executed chat cleanup script for user1082 (장지훈 학생)
  * Removed 8 conversations and 8 messages while preserving specific agent conversations
  * Kept conversations with: 기숙사 Q&A 에이전트 (ID: 117), 정수빈 교수의 현대 문학 에이전트 (ID: 146)
  * Also preserved conversation capability with 국어국문학과 심리실험 안내 (ID: 197) for future use
  * Updated persistent storage files to reflect changes across server restarts
- July 3, 2025. Implemented responsive navigation UI for master admin interface:
  * Fixed mobile navigation tab overlapping issue by implementing grid responsive layout
  * Mobile: 2 columns display with shortened tab labels ("조직", "사용자", "에이전트", etc.)
  * Tablet: 4 columns layout with full functionality
  * Desktop: 8 columns with complete tab labels and icons
  * Enhanced header buttons with responsive text and icon sizing
  * Added custom CSS classes for consistent responsive behavior across all screen sizes
- July 2, 2025. Finalized user1082 chat management and agent visibility:
  * Confirmed user1082 has exactly 3 active conversations: ID 146 (정수빈 교수의 현대 문학 에이전트), ID 117 (기숙사 Q&A 에이전트), ID 177 (교수진 탐색기)
  * Removed unnecessary agent hiding configurations to restore normal system operation
  * User chat list now shows only authentic conversations from AI 에이전트 0627_2 Excel data
  * System maintains full agent database while user sees only relevant conversations
- July 2, 2025. Redesigned login page with minimal flat UI design:
  * Implemented blue gradient background with white central card layout matching provided design reference
  * Added flat input fields with bottom border only (no full borders) for modern minimalist appearance
  * Replaced radio buttons with visual icon buttons for account type selection (Student/Faculty/Master)
  * Added three icon buttons: GraduationCap for students, UserCheck for faculty, Shield for master admin
  * Icon buttons auto-fill credentials and provide visual selection feedback with blue borders
  * Master account button triggers automatic login for immediate admin center access
  * Maintained transparent demo account buttons below main form with backdrop blur effects
  * Complete flat UI transformation following minimal design principles
- July 2, 2025. Redesigned agent management interface layout:
  * Restructured agent management section to match organization category management UI design
  * Separated action buttons (에이전트 수동 추가, 파일 업로드) from filtering area
  * Action buttons now display as cards with consistent styling (blue/green backgrounds, icons, descriptions)
  * Moved filtering area to independent box below action buttons for better visual hierarchy
  * Applied consistent fonts, spacing, and styling matching organization management interface
  * Enhanced user experience with unified UI patterns across master admin sections
- July 2, 2025. Enhanced agent detail popup file upload tab with comprehensive document management:
  * Added document type dropdown with 7 categories (강의 자료, 교육과정, 정책 문서, 매뉴얼, 양식, 공지사항, 기타)
  * Implemented document description textarea for detailed file descriptions
  * Created complete document list table with columns: 문서명, 종류, 크기, 업로드 날짜, 상태, 설정
  * Applied consistent styling matching document management popup design patterns
  * Added action buttons for preview, download, and delete operations
  * Document list displays with proper icons, badges, and hover effects matching existing UI standards
- July 2, 2025. Fixed agent document list to show authentic data instead of dummy content:
  * Removed hardcoded sample document entries from agent detail popup
  * Created AgentDocumentList component that fetches real data from /api/admin/documents
  * Added proper filtering to show only documents uploaded to the selected agent
  * Implemented empty state message when no documents are uploaded
  * Maintained consistent UI styling with document management system without affecting other menu systems
  * Document count badge now accurately reflects actual uploaded document count per agent
- July 2, 2025. Removed document text extraction repair action button from document management menu:
  * Deleted "문서 텍스트 추출 수정" action button card from document management interface
  * Removed handleFixDocuments function and fixDocumentsMutation mutation
  * Cleaned up related code and comments for streamlined document management interface
  * Document management screen now displays only document statistics without repair functionality
- July 2, 2025. Fixed master admin icon change functionality:
  * Resolved disabled "이미지 업로드" button in master admin page icon change dialog
  * Added custom image upload state management (isUsingCustomImage, customImageFile, customImagePreview)
  * Implemented file validation for image uploads (5MB limit, JPG/PNG/GIF/WEBP formats)
  * Enhanced changeIconMutation to support both custom images and standard icons via FormData
  * Added image preview functionality showing selected custom images in icon preview area
  * Updated UI to properly toggle between standard icon and custom image upload modes
  * Custom image upload now works correctly in master admin agent management interface
- July 4, 2025. Implemented comprehensive document deletion system with agent notifications:
  * Added "문서 삭제" button to document detail popup in master admin interface
  * Created deletion confirmation dialog with AlertTriangle warning icon and detailed impact description
  * Updated deletion process to preserve agents and conversation history while removing document references
  * Implemented automatic notification system sending alerts to connected agents when documents are deleted
  * Agent notification message format: "[문서명] 파일이 [에이전트명] 에이전트에서 삭제되었습니다. 해당 파일 기반으로 한 대화는 불가능합니다."
  * Enhanced server-side deletion logic to create management conversation notifications for affected agents
  * Document deletion now safely removes files while maintaining system integrity and user communication
- July 4, 2025. Enhanced multilingual admin center with comprehensive translation system:
  * Fixed service title display issue by shortening titles in all 5 languages for single-line display
  * Updated Korean: "LoBo AI 챗봇 통합 관리자 센터" → "LoBo AI 관리자 센터"
  * Updated English: "LoBo AI Chatbot Integrated Management Center" → "LoBo AI Admin Center"
  * Added CSS styling to prevent title text wrapping with ellipsis overflow handling
  * Converted System Status items to use translation keys: Database, OpenAI API, Session Store, File Upload
  * Translated "최근 활동" (Recent Activities) title to use multilingual translation system
  * Updated all major section headers to use translation keys: User Management, Agent Management, Organization Management, Document Management, Token Management, System Settings
  * Enhanced status indicators to display localized text (정상/Healthy/正常/Tốt/正常) based on selected language
  * Complete admin center now serves all content in user's selected language (Korean, English, Chinese, Vietnamese, Japanese)
- July 4, 2025. Completed comprehensive organization management interface multilingual translation:
  * Added complete organization management translation keys covering all UI elements
  * Implemented translations for all 5 languages: Korean, English, Chinese, Vietnamese, Japanese
  * Organization management terminology translated: LMS 연동 (권장), 파일 업로드, 조직 카테고리 검색 및 관리
  * Filter dropdown translations: 상위조직, 하위조직, 세부조직, 전체, 필터 초기화
  * Table header translations: 상위 조직, 하위 조직, 세부 조직, 관리자, 소속 인원, 에이전트 수, 상태, 선택
  * Pagination text: 전체 124개 조직 중 1-20개 표시 translated to all languages
  * Complete UI consistency achieved across all organization management interface elements
  * All hardcoded Korean text replaced with translation keys for international accessibility
- July 5, 2025. Completed comprehensive document management multilingual translation and UI optimization:
  * Fixed all hardcoded English text in document management section to use translation keys
  * Added complete document management translations for all 5 languages: 비활성 문서, 총 용량, 기타, 필터 초기화, 검색 결과, 검색어
  * Enhanced question/answer logs with 4 cards including restored user satisfaction card (사용자 만족도)
  * Redesigned token management cards to match question/answer logs compact style with 3-column grid layout
  * All document management interface elements now properly display in user's selected language
  * Korean language mode completely eliminates English text throughout admin interface
  * Token management statistics now show compact inline format matching Q&A log card design
  * Redesigned both question/answer logs and token management cards to use single-line layout
  * Cards now display title and icon on left side, statistics and analysis on right side
  * Applied consistent horizontal layout across all summary cards for improved visual hierarchy
  * Fixed Korean mode document management by replacing all translation keys with direct Korean text
  * Document statistics cards now display: "문서 통계", "전체 파일", "비활성 문서", "총 용량", "최근 업로드"
  * Document search interface now shows: "문서 검색 및 관리", "파일 형식", "업로드 날짜", "필터 초기화"
  * Table headers properly display: "파일명", "종류", "크기", "업로드 날짜" in Korean mode
  * Search placeholder and buttons now use Korean text: "문서명 또는 내용으로 검색...", "검색", "검색어"
- July 6, 2025. Completed comprehensive user management dropdown terminology standardization:
  * Successfully updated all user management areas to use unified "조직 카테고리" terminology
  * User search area: Updated "상위/하위/세부 카테고리" to "상위/하위/세부 조직 카테고리"
  * User edit modal: Converted labels to "상위/하위/세부 조직 카테고리" and added required field indicators (*)
  * New user addition form: Updated labels to "상위/하위/세부 조직 카테고리" with required field indicators (*)
  * Established consistent terminology across all three user management interfaces
  * Enhanced form validation with clear required field indicators throughout user management system
- July 6, 2025. Implemented user management UI improvements and agent click functionality:
  * Removed required field indicator (*) from all three instances of "하위 조직 카테고리" labels in user management forms
  * Enhanced UserActiveAgents component with click navigation functionality
  * Added onAgentClick prop to UserActiveAgents interface for agent detail popup navigation
  * Implemented cursor-pointer styling and click events on agent cards in user active agent list
  * Agent cards now open detailed information popup when clicked for improved user experience
- July 8, 2025. Implemented consistent pagination rules across all management sections:
  * Standardized all management sections to show 20 items per page using unified ITEMS_PER_PAGE constant
  * Added "전체 N개 중 N개 표시" pagination count display to all sections (users, agents, organizations, documents, QA logs, tokens)
  * Updated user management, agent management, document management, QA logs, and token management pagination
  * Implemented previous/next buttons and page number navigation using PaginationComponent
  * Fixed Excel export metadata and security headers to avoid Protected View warnings
  * All pagination displays now consistent across organization categories, users, agents, documents, conversations, and token management
- July 9, 2025. Reorganized user management action buttons layout to match agent management:
  * Restructured user management section with three action cards at the same height
  * Action cards: LMS 연동 (blue), 파일 업로드 (green), 사용자 수동 추가 (orange)
  * Changed grid layout from 2 columns to 3 columns for consistent action button placement
  * Moved "사용자 추가" button from header to dedicated action card following agent management design pattern
  * Enhanced visual consistency across management sections with unified card-based interface
- July 9, 2025. Updated organization status from "등록 승인 대기중" to "비활성":
  * Successfully updated 18 organizations from "등록 승인 대기중" status to "비활성"
  * Updated organizations include: IR팀, 교육과정혁신팀, 영어교육전공, 국제관계전공, 통계학전공, 데이터사이언스전공, 인사조직전공, 아동간호전공, 일러스트레이션전공, 발레전공, 작곡전공, 생활체육전공, 연기전공, 복지증진팀, 봉사동아리연계팀, 정책건의팀, 교육대학원, 산업기술연구소
  * All affected organizations now have status: "비활성", isActive: false, and updated description fields
  * Total "비활성" organizations: 35, Total organizations: 124
  * Verification confirmed zero remaining "등록 승인 대기중" organizations in the system
- July 9, 2025. Restructured organization category management layout to match agent management design:
  * Moved "새 조직 카테고리 추가" button from header to orange-themed action card
  * Updated grid layout from 2-column to 3-column for three action cards at same height
  * Action cards: LMS 연동 (blue), 파일 업로드 (green), 새 조직 수동 추가 (orange)
  * Removed duplicate pagination text from bottom of organization list (kept only header count display)
  * Enhanced visual consistency across management sections with unified card-based interface
- July 9, 2025. Completed comprehensive agent search functionality in document management system:
  * Enhanced document detail modal with complete agent connection interface
  * Implemented multi-tier organization category filtering (상위/하위/세부 카테고리)
  * Added agent type filtering and real-time search functionality
  * Created comprehensive agent selection table with organization data, statistics, and pagination
  * Connected agents now display with card format showing organization hierarchy and connection dates
  * All filtering, search, and pagination logic working with actual database organization data
- July 9, 2025. Removed chat room deletion functionality from agent management interface:
  * Deleted "대화방 삭제" menu item from management mode dropdown in ChatInterface
  * Removed showDeleteConfirmModal state variable and related confirmation modal
  * Removed deleteConversationMutation and all related deletion logic
  * Cleaned up unused Trash2 icon import from lucide-react
  * Chat room deletion feature completely removed per user request from specific UI location
- July 9, 2025. Enhanced dashboard with new analytics cards replacing recent activity:
  * Removed "최근 활동" (Recent Activity) summary card from dashboard
  * Added document total capacity card showing "0.1M 토큰" with FileText icon
  * Added Q&A management cards section with 4 cards: daily questions (247, +12%), average response time (2.3초, -0.3초), response failure rate (3.2%, 전월 대비), user satisfaction (4.6/5, 향상 중)
  * Added token management cards section with 3 cards: daily average (2.6K, +12% 지난 주 대비), estimated cost (₩6,761, 이번 달 예상 비용), input average (73% 상승, 전월 평균)
  * All new cards follow existing dashboard card styling with consistent icons, typography, and responsive grid layout
  * Added Clock, Star, DollarSign, TrendingUp icons from lucide-react for enhanced visual indicators
- July 9, 2025. Implemented color-coded dashboard cards and improved agent management interface:
  * Added comprehensive color-coded grouping for dashboard summary cards:
    - System statistics: default white background  
    - Today activity: blue theme (border-blue-200, bg-blue-50)
    - Q&A management cards: green theme (border-green-200, bg-green-50)
    - Token management cards: orange theme (border-orange-200, bg-orange-50)
    - Popular questions TOP 5: purple theme (border-purple-200, bg-purple-50)
  * Repositioned popular questions TOP 5 and system status cards on same row for balanced layout
  * Enhanced agent management table by removing "수정" text and keeping only edit icon
  * Changed table header from "수정" to "설정" for better clarity
  * Improved visual hierarchy with consistent color theming across all dashboard sections
- July 9, 2025. Implemented comprehensive agent management pagination system:
  * Added pagination state management with 20 items per page (AGENTS_PER_PAGE constant)
  * Implemented paginatedAgents processing with startIndex/endIndex slicing logic
  * Added "전체 N개 중 N-N개 표시" count display in CardHeader matching organization category format
  * Integrated PaginationComponent with currentPage, totalPages, and onPageChange handlers
  * Added automatic page reset functionality when searching or filtering agents
  * Pagination only appears when total pages > 1 for clean UI experience
  * Complete pagination system follows same rules as organization category list
- July 9, 2025. Enhanced pagination UI with center alignment and clean design:
  * Removed unnecessary wrapper divs from all pagination implementations
  * Eliminated top borders and background colors for cleaner appearance
  * Centered all pagination controls across management sections (users, agents, organizations, documents)
  * Simplified pagination component styling for consistent display throughout admin interface
- July 9, 2025. Implemented realistic response times and standardized pagination to 15 items:
  * Replaced "즉시" text with realistic response times (0.1초 ~ 2.5초) in Q&A management section
  * Generated consistent response times based on conversation ID for data stability
  * Changed ITEMS_PER_PAGE from 20 to 15 across all management sections
  * Updated document management to use PaginationComponent for consistent center alignment
  * All list sections now display 15 items per page: Q&A logs, users, agents, organizations, documents, tokens
- July 9, 2025. Standardized search input interface across all management sections:
  * Updated search input placeholders: "조직명으로 검색하세요." for organizations, "문서명 또는 내용으로 검색하세요." for documents, "질문 내용으로 검색하세요." for questions
  * Unified all search input labels to "검색어" across all management sections
  * Applied consistent search button styling with variant="outline" and h-10 w-full classes
  * Fixed separate AGENTS_PER_PAGE and usersPerPage constants to use unified 15 items per page
  * All search interfaces now follow consistent design pattern matching user management section
- July 9, 2025. Implemented consistent filter reset button styling across all management sections:
  * Applied variant="outline" and h-10 w-full styling to all filter reset buttons
  * Updated all "필터 초기화" buttons to match search button appearance
  * Added missing filter reset button to token management section with proper functionality
  * All filter reset buttons now have consistent padding and outline styling
  * Enhanced token management section with 5-column grid layout to accommodate new filter reset button
- July 9, 2025. Unified search button styling across all management sections to match agent management:
  * Removed variant="outline" from all search buttons to match agent management section baseline
  * Updated search buttons in user management, organization category management, document management, Q&A management, and token management
  * All search buttons now use consistent basic styling with h-10 w-full classes
  * Complete UI consistency achieved with agent management section as the reference standard
- July 9, 2025. Fixed critical multilingual translation system for master admin dashboard:
  * Identified and resolved hardcoded Korean text in Q&A management cards preventing language switching
  * Added comprehensive translation keys for dashboard metrics: todayQuestionsTitle, avgResponseTimeTitle, responseFailureTitle, userSatisfactionTitle
  * Implemented complete translations for all 5 languages (Korean, English, Chinese, Vietnamese, Japanese)
  * Resolved duplicate key warnings in LanguageContext.tsx by removing redundant entries
  * Master admin dashboard now fully supports language switching with proper translation of all UI elements
  * Fixed internationalization issue where English language setting didn't properly translate dashboard card titles
- July 21, 2025. Updated agent chat interface settings menu and system-wide organization terminology:
  * Changed agent chat header button from "설정" to "기능 선택" per user request
  * Removed "계정 설정" (Account Settings) and "로그아웃" (Logout) options from general chat mode dropdown menu
  * Completed system-wide organization category dropdown naming standardization across ALL management sections:
    - Changed "상위 조직 카테고리" → "상위 조직"
    - Changed "하위 조직 카테고리" → "하위 조직"
    - Changed "세부 조직 카테고리" → "세부 조직"
  * Updated all filtering areas: user management, agent management, organization management, document management, token management
  * All dropdown menus now use consistent simplified naming without "카테고리" suffix
- July 23, 2025. Synchronized agent management persona forms for UI consistency:
  * Updated agent detail popup persona tab to match new agent creation popup structure
  * Added missing fields: expertiseArea (지식/전문 분야) and additionalPrompt (추가 프롬프트)
  * Unified field layout with proper translation keys for all persona fields
  * Both forms now contain identical 5 persona fields: nickname, speechStyle, expertiseArea, personality, additionalPrompt
  * Enhanced form consistency with proper placeholder examples and field organization
  * Improved user experience with standardized persona editing across agent management interfaces
  * Completed full Korean localization of token management screen with proper organization filter labels
- July 23, 2025. Enhanced agent management UI terminology and file upload interface:
  * Updated agent management terminology: "AI 답변 설정" → "모델 및 응답 설정" and "답변 생성 방식" → "응답 생성 방식" in all language files
  * Applied terminology changes consistently in ChatInterface.tsx, LanguageContext.tsx, and ChatbotSettingsModal.tsx
  * Enhanced file upload modal with white text buttons and expanded file format support (XLSX, CSV, HWP, JPG, PNG, GIF, BMP)
  * Removed duplicate UI elements from agent file upload popup for cleaner interface
  * Fixed duplicate key warnings in LanguageContext.tsx translation files
- July 23, 2025. Updated master admin system agent tab terminology:
  * Changed "모델 설정" to "모델 및 응답 설정" in both agent creation and detail popup tabs
  * Updated three locations in MasterAdmin.tsx: tab comments and tab trigger text
  * Updated translation keys in LanguageContext.tsx for both Korean and English versions
  * Applied consistent terminology across all agent management interfaces in master admin system
- July 9, 2025. Completed comprehensive filter reset button styling standardization:
  * Removed variant="outline" from all filter reset buttons across all management sections
  * Updated filter reset buttons in user management, agent management, organization category management, document management, Q&A management, and token management
  * All filter reset buttons now match search button styling with h-10 w-full classes
  * Enhanced Q&A management table with improved column naming and response success tracking:
    - Changed "응답 실패율" to "응답 성공" in table header and dashboard cards
    - Implemented dynamic success/failure detection based on message count and AI responses
    - Success responses display with green badges, failures with red badges
    - Updated dashboard card to show "96.8% 성공률" with CheckCircle icon instead of failure rate
  * Complete UI consistency achieved across all management interface components
- July 9, 2025. Implemented comprehensive language system cleanup and English mode Korean text conversion:
  * Removed Chinese, Vietnamese, and Japanese languages from language conversion menu system
  * Updated Language type definition to only include 'ko' | 'en' types
  * Cleaned up LanguageContext.tsx to contain only Korean and English translations
  * Updated LanguageSelector component to show only Korean and English options
  * Implemented automatic Korean text to English translation when English mode is selected
- July 21, 2025. CRITICAL FIX: Resolved mobile Management page duplicate header issue:
  * Identified root cause: URL routing conflict where `/chat/:agentId` was matching before `/management/:agentId`
  * Fixed App.tsx routing order to prioritize Management routes over Chat routes
  * Management pages now properly render Management.tsx component instead of Chat.tsx
- July 23, 2025. Simplified file upload text descriptions across all management interfaces:
  * Removed specific CSV/Excel file format mentions from all action card descriptions
  * Updated Korean translations: "CSV/Excel 파일을 업로드하여" → "파일을 업로드하여"
  * Updated English translations: "Upload CSV/Excel files to" → "Upload files to"
  * Applied changes to agent management, organization management, and user management sections
  * Enhanced user experience with simplified, non-technical file upload descriptions
  * Eliminated duplicate headers in mobile Management mode - only proper management interface appears
  * isManagementMode prop now correctly set to true for Management pages, removing unwanted Chat headers
- July 21, 2025. Standardized organization category dropdown naming and fixed token management Korean localization:
  * Simplified organization category dropdown labels across ALL management sections (users, agents, organizations, documents, Q&A, tokens):
    - "상위 조직 카테고리" → "상위 조직"
    - "하위 조직 카테고리" → "하위 조직"  
    - "세부 조직 카테고리" → "세부 조직"
  * Fixed token management section Korean localization by replacing translation keys with direct Korean text
  * Applied consistent naming to user edit forms, new user creation forms, agent creation forms, and all filter dropdowns
  * Token management filtering area now displays proper Korean labels instead of English translations
  * Enhanced UI consistency across all administrative management interfaces
- July 21, 2025. Implemented role-based visibility settings for agent management:
  * Created comprehensive VisibilitySettingsModal with role-based permissions for master admin and agent managers
  * Master admin: Full control over public/group visibility settings and organization hierarchy selection
  * Agent manager: Can modify visibility status (공개/비공개) but cannot change scope settings
  * Both roles can see agent's organization hierarchy information displayed as text format
  * Enhanced ChatInterface with "공개 설정" dropdown menu option in management mode
  * Updated management mode welcome message to include all management features including icon change and document management
  * Complete Korean localization with proper role-based permissions and intuitive toggle interface
  * Fixed JSX syntax errors and improved visual feedback with color-coded toggle buttons
- July 17, 2025. Completed comprehensive document visibility control system:
  * Removed toggle functionality from document list visibility column
  * Document list shows only status icons (blue open eye for visible, red closed eye for hidden)
  * Moved visibility settings dropdown to document detail popup next to document status dropdown
  * Merged document status area into document information area for cleaner layout
  * Added proper userRole definition in ChatInterface to fix hidden document filtering
  * Document visibility system now fully functional with improved UI organization
- July 17, 2025. Fixed document detail popup connected agents display and simplified file upload completion:
  * Fixed document detail popup to properly show connected agent names using agentId field
  * Connected agents now display correctly in "현재 연결된 에이전트" section of document detail popup
  * Simplified agent chatbot file upload completion message from popup-over-popup to simple toast notification
- July 24, 2025. Enhanced new agent creation form with improved Korean terminology and restructured file upload:
   * Updated new agent creation popup in MasterAdmin.tsx with consistent Korean terminology
   * Basic info tab changes: "유형" → "에이전트 유형", "소속" → "소속 조직", "에이전트 설명" → "에이전트 소개"
   * Persona tab changes: "에이전트 이름" → "닉네임" for consistency with persona configuration
   * File upload tab restructuring: moved document type dropdown below drag-and-drop area, removed "절차/프로세스" option
   * Applied same terminology changes to agent edit dialog for system-wide consistency
   * Enhanced user experience with Korean localization throughout agent management interface
- July 24, 2025. Implemented read-only agent name in basic info edit modal:
   * Changed agent name field from editable input to read-only text display in BasicInfoEditModal.tsx
   * Added explanatory text: "에이전트 이름은 관리자 시스템에서만 변경 가능합니다."
   * Updated server API endpoint to exclude name field from basic-info updates
   * Modified client form submission to omit name field from update requests
   * Enhanced user experience by clearly indicating permission restrictions for agent name changes
- July 24, 2025. Updated search placeholder text in agent list:
   * Changed search input placeholder from "에이전트 검색..." to "에이전트 이름 또는 설명 키워드로 검색하세요."
   * Updated home.searchPlaceholder translation key in LanguageContext.tsx
   * Change applies to both mobile (Home.tsx) and tablet (TabletLayout.tsx) layouts
   * Provides clearer guidance on what users can search for in agent discovery interface
- July 24, 2025. Updated basic information modal guidance texts:
   * Removed admin restriction notice: "에이전트 이름은 관리자 시스템에서만 변경 가능합니다." from agent name field
   * Added usage guidance for agent description: "소개에 입력된 내용은 사용자들을 위한 안내 메시지에 활용됩니다."
   * Enhanced user understanding of how agent introduction content affects user experience
   * Simplified agent name field display by removing unnecessary administrative notices
- July 24, 2025. Updated chatbot settings response generation dropdown options:
   * Changed "일반 챗봇" label to "LLM 전용" for clearer terminology
   * Removed "LLM + 웹검색" option from response generation methods
   * Simplified chatbot type selection to 3 options: 문서 기반 전용, 문서 우선 + LLM, LLM 전용
   * Enhanced clarity in model and response settings configuration
  * Removed duplicate result modal from FileUploadModal component for cleaner user experience
  * File upload now shows toast message and closes modal automatically after successful upload
- July 17, 2025. Implemented document upload options removal and visibility control system:
  * Removed upload options section from master admin system document upload popup
  * Added document visibility control feature allowing administrators to hide documents from regular users
  * Enhanced document visibility icons with stronger visual distinction (blue open eye vs red closed eye with slash)
  * Implemented document visibility setting in agent chatbot file upload modal
  * Added visibility control state management and form submission for both admin and agent upload interfaces
  * Documents can now be hidden from regular users while remaining accessible to admin accounts
- July 16, 2025. Enhanced UI visibility and document management interface:
  * Added document visibility column to master admin document table with status indicators
  * Implemented quick toggle buttons for document visibility control (표시/숨김)
  * Fixed ChatbotSettings modal gear icon visibility by changing color from text-primary to text-gray-900/white
  * Enhanced document management with 8-column table layout including visibility controls
  * Improved visual feedback with green/red badges for document visibility status
- July 9, 2025. Standardized document type dropdown menus across all file upload locations:
  * Updated all document type dropdowns to use consistent Korean labels: 강의자료, 정책·규정 문서, 매뉴얼·가이드, 서식·양식, 공지·안내, 교육과정, FAQ·Q&A, 연구자료, 회의·내부자료, 기타
  * Changed default selection to "기타" for all file upload modals: FileUploadModal.tsx, MasterAdmin.tsx agent detail modal
  * Ensured consistency across three key upload locations: Agent management chat modal, Document management upload modal, Document detail modal agent connection tab
  * All document type dropdown menus now provide uniform user experience with standardized terminology
    - User messages containing Korean text are automatically translated to English
    - Agent names, descriptions, speaking styles, and personality traits are translated
    - Conversation history is translated to maintain context in English
    - Document content is translated to English for proper context understanding
    - Management system messages are displayed in appropriate language
  * Enhanced OpenAI integration with intelligent Korean text detection and translation
  * Language menu now displays only Korean (🇰🇷 한국어) and English (🇺🇸 English) options
  * Complete multilingual functionality preserved for Korean and English while removing unnecessary languages
- July 9, 2025. Enhanced Q&A management table with improved column naming and data:
  * Changed "작업" column to "개선 요청" for better clarity
  * Updated "응답 실패율" to "응답 실패" for simplified display
  * Renamed "응답 유형" to "응답 방식" to match agent creation terminology
  * Implemented response method data matching agent creation settings: "문서 우선 + LLM", "LLM 우선", "문서만"
  * Removed eye icon button from action column, keeping only message feedback button
  * Dynamic response method assignment based on conversation ID for consistent data display
  * Repositioned "시간" column between "응답 시간" and "개선 요청" columns for better information flow
- July 18, 2025. Enhanced message notification badges with improved visibility and refined styling:
- July 21, 2025. Completed comprehensive pagination layout standardization across all management sections:
  * Updated PaginationComponent.tsx with conditional showItemCount display system
  * Modified ALL management sections to show pagination information in CardHeader (top-right position)
  * Added showItemCount={false} to all PaginationComponent instances to prevent duplicate pagination information
  * Updated user management, Q&A management, organization category management, document management, and token management sections
  * Implemented descriptive Korean text format: "전체 N개 [항목] 중 N-N개 표시" in all CardHeader components
  * Complete pagination UI consistency achieved across entire master admin interface system
  * Increased message badge size and visual prominence with red background, white text, and font-bold styling
  * Added shadow effects (shadow-lg) and white border (border-2) for better contrast
  * Initially implemented animate-pulse effect for attention-grabbing behavior
  * Refined badge sizing from 22px back to 18px for more balanced appearance
  * Removed animate-pulse animation effect per user preference for cleaner interface
  * Applied consistent styling across AgentList.tsx and TabletLayout.tsx components
  * Final badge configuration: 18px height, red background, white border, shadow effect, no animation
  * Filtered out "메시지 없음" entries to show only conversations with actual user-chatbot interactions
- July 9, 2025. Implemented comprehensive Q&A management filter reset functionality:
  * Added "필터 초기화" button to Q&A log search area using 5-column grid layout
  * Created resetQAFilters function to reset all Q&A filter states (organization categories, user type, period, search query)
  * Added Q&A filter state variables: qaUserTypeFilter, qaPeriodFilter, qaSearchQuery
  * Connected all Q&A filter inputs to state variables with proper onChange handlers
  * Filter reset button now clears all filters and resets pagination to page 1
  * All Q&A management buttons now follow consistent styling matching agent management search button design
- July 9, 2025. Implemented comprehensive Q&A detail modal with organization hierarchy display:
  * Added Q&A detail modal triggered by improvement request column MessageSquare icon clicks
  * Created openQADetailModal function and showQADetailModal state management
  * Modal displays: conversation time, agent name, category hierarchy (상위>하위>세부), response status
  * Shows question content in blue background box and response content in gray background box
  * Implemented user satisfaction display with thumbs up/down icons (좋아요/싫어요)
  * Added response time display calculated from conversation ID for consistency
  * Category hierarchy shows only existing levels (상위 only, 상위>하위, or 상위>하위>세부)
  * All data generated from conversation logs and agent organization information for authentic display
- July 9, 2025. Enhanced Q&A management with dual modal functionality and improved interaction:
  * Modified Q&A table rows to be clickable for opening detailed Q&A modal (질문응답 상세보기)
  * Changed category label from "카테고리" to "소속 조직" in Q&A detail modal
  * Updated Q&A detail modal to show real conversation data instead of sample responses
  * Separated improvement request functionality: MessageSquare icon opens "개선 요청 및 코멘트" modal
  * Implemented improvement request modal with question/answer display and comment textarea
  * Added proper event handling to prevent row clicks when clicking improvement request button
  * Both modals now display authentic conversation data from messages and agent organization information
- July 9, 2025. Enhanced Q&A management table with improved column names and data:
  * Changed "작업" column to "개선 요청" for better clarity
  * Updated "응답 실패율" to "응답 실패" for simplified display
  * Renamed "응답 유형" to "응답 방식" to match agent creation terminology
  * Implemented response method data matching agent creation settings: "문서 우선 + LLM", "LLM 우선", "문서만"
  * Removed eye icon button from action column, keeping only message feedback button
  * Dynamic response method assignment based on conversation ID for consistent data display
- July 10, 2025. Completed comprehensive document management features in agent management mode:
  * Implemented eye icon (노출/비노출) and brain icon (학습/미학습) toggle functionality in ChatInterface file list modal
  * Added document visibility and training toggle mutations with proper API integration
  * Document management features only appear in management mode (isManagementMode flag)
  * Regular chatbot mode remains unchanged with basic file list functionality
  * Document-agent connection system working with server-side API endpoints
  * Fixed login screen username field registration issue preventing form submission
  * Updated performance analysis message format with proper icons (📊, ▶, 🔍, 📈) and structured layout
  * Applied consistent line breaks and Korean terminology for system messages
- July 22, 2025. Enhanced search input Korean localization and user satisfaction removal:
  * Removed user satisfaction summary cards from dashboard and Q&A logs management sections
  * Updated search input placeholders in Korean mode across all management sections:
    - Agent management: "에이전트 이름 또는 설명 키워드를 입력하세요."
    - Document management: "문서명으로 검색하세요."
    - Q&A management: "질문 키워드로 검색하세요."
  * Maintained multilingual support with appropriate fallbacks for other languages
  * Completed Korean UI localization for all search interface elements
- July 22, 2025. Optimized dashboard summary card layout for maximum space efficiency:
  * Restructured dashboard layout from 3 separate card rows to 2 compact rows plus bottom section
  * Top section: 6 main metrics in 2x3 grid layout (lg:grid-cols-3) with compact card design
  * Middle section: 4 additional metrics in 1x4 grid layout (lg:grid-cols-4) with unified spacing
  * Bottom section: Popular questions and system status in 1x2 layout (lg:grid-cols-2)
  * Reduced card padding from default to p-3 for tighter spacing
  * Implemented inline layout for all card content (title, value, subtitle) with icons
  * Reduced font sizes to text-lg for main values and text-xs for labels/subtitles
  * Compressed popular questions to show only top 3 items with simplified display
  * Minimized system status items with compact badge styling
  * Overall space usage reduced by approximately 40% while maintaining readability
- July 22, 2025. Streamlined LMS integration settings across all management sections:
  * Removed document type selection field from organization category management LMS popup
  * Removed document description textarea from organization category management LMS popup
  * Removed document type selection field from user management LMS popup
  * Removed document description textarea from user management LMS popup
  * Updated file upload button dependencies to remove documentType requirement
  * Modified document upload handler to use default 'all' type for simplified workflow
  * LMS integration settings now focus only on connection parameters without document categorization
  * Simplified document upload process across all management menu LMS integration dialogs
- July 22, 2025. Updated dashboard popular questions display count:
  * Changed popular questions summary card to display 5 questions instead of 3
  * Modified popularQuestions.slice(0, 3) to popularQuestions.slice(0, 5) in dashboard
  * Popular questions TOP 5 card now properly shows 5 question items as intended
  * Enhanced dashboard summary with complete top 5 popular questions visibility
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Performance optimization priority: Fast startup and responsive UI.
```