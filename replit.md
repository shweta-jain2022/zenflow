# Overview

MindFlow is a comprehensive productivity and mindfulness web application designed to help users manage their daily tasks, maintain focus through timed sessions, practice mindfulness, track their mood and journaling, and monitor their progress over time. The app provides a responsive interface optimized for both desktop and mobile devices, offering a holistic approach to personal well-being and productivity.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a modern React-based frontend built with TypeScript and Vite. The UI is constructed using Shadcn/UI components built on top of Radix UI primitives, providing a consistent and accessible design system. The application follows a component-based architecture with clear separation of concerns:

- **Routing**: Uses Wouter for lightweight client-side routing
- **State Management**: Leverages TanStack Query for server state management and React hooks for local state
- **Styling**: Implements Tailwind CSS with CSS custom properties for theming, supporting both light and dark modes
- **Layout**: Responsive design with dedicated mobile navigation and desktop sidebar layouts

## Backend Architecture
The backend is built using Express.js with TypeScript, following a RESTful API design pattern. The architecture emphasizes:

- **API Routes**: Organized in a dedicated routes module handling all CRUD operations for tasks, moods, journals, focus sessions, and meditations
- **Data Validation**: Uses Zod schemas for runtime type validation and data integrity
- **Error Handling**: Centralized error handling middleware for consistent API responses
- **Development Setup**: Integrated with Vite development server for hot module replacement and development tooling

## Data Storage Solutions
The application uses a PostgreSQL database accessed through Drizzle ORM, providing type-safe database operations:

- **Schema Design**: Well-structured relational schema with proper foreign key relationships linking all entities to users
- **Database Tables**: Users, tasks, moods, journals, focus sessions, and meditations with appropriate indexing
- **Migration Management**: Drizzle Kit for schema migrations and database versioning
- **Connection Management**: Uses connection pooling through the postgres client for optimal performance

## Authentication and Authorization
User authentication is handled through Supabase Auth, providing:

- **Authentication Flow**: Email/password signup and signin with session persistence
- **Authorization**: Route protection ensuring only authenticated users can access protected resources
- **Session Management**: Automatic token refresh and session validation
- **User Context**: React context for global user state management throughout the application

## Core Features Implementation

### Task Management
- CRUD operations for tasks with priority levels and due dates
- Real-time updates using optimistic UI patterns
- Task filtering and completion tracking

### Focus Timer (Pomodoro)
- Customizable work and break intervals with multiple timer modes
- Background timer functionality with completion notifications
- Session tracking and statistics for productivity insights

### Mindfulness Features
- Guided breathing exercises with visual animations and customizable timing
- Meditation session tracking with duration logging
- Progressive breathing patterns for stress reduction

### Mood and Journal Tracking
- Daily mood check-ins with emoji-based mood selection
- Free-form journaling with rich text capabilities
- Historical mood and journal entry viewing

### Progress Analytics
- Weekly and monthly progress summaries
- Data visualization using Recharts for task completion, focus time, and mood trends
- Statistical insights into productivity patterns

# External Dependencies

## Third-Party Services
- **Supabase**: Backend-as-a-Service providing authentication, real-time subscriptions, and additional backend capabilities
- **Neon Database**: PostgreSQL database hosting with connection pooling and automatic scaling

## Key Libraries and Frameworks
- **React**: Core frontend framework with hooks-based architecture
- **TypeScript**: Static type checking across frontend and backend
- **Express.js**: Backend web application framework
- **Drizzle ORM**: Type-safe PostgreSQL ORM with migration support
- **TanStack Query**: Server state management with caching and synchronization
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Radix UI**: Headless UI components for accessibility and consistency
- **React Hook Form**: Form validation and management
- **Recharts**: Data visualization and charting library
- **Zod**: Runtime type validation and schema definition

## Development and Build Tools
- **Vite**: Frontend build tool and development server
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind integration
- **TSX**: TypeScript execution environment for development