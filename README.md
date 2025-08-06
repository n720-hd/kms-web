# Research Knowledge Management System

A comprehensive research platform and knowledge management system built with Next.js that enables researchers, students, and experts to collaborate, share knowledge, and conduct AI-powered research.

## 🚀 Features

### Core Platform Features
- **Advanced Search System**: AI-powered search with contextual understanding and filtering
- **Q&A Platform**: Community-driven question and answer system with rating/voting
- **AI Assistant Integration**: Multiple AI models (DeepSeek R1, Qwen 3) via backend API
- **Real-time Chat**: WebSocket-powered global discussions and AI conversations
- **User Management**: Multi-role system (admin, user, creator) with division-based organization
- **Content Management**: Question lifecycle management, answer approval workflows
- **Deep Review System**: Systematic literature review capabilities

### Advanced Features
- **Smart Notifications**: Real-time notification system with WebSocket integration  
- **Research Tools**: Comprehensive dashboard for research analytics and insights
- **Content Moderation**: Admin controls for question takedown and answer approval
- **Profile Management**: User profiles with reputation and contribution tracking
- **Mobile Responsive**: Fully optimized for all devices with adaptive UI

## 🛠️ Technology Stack

### Frontend Framework
- **Next.js 15.3.1** with App Router and React 19
- **TypeScript** for type safety
- **Tailwind CSS 4.0** for styling
- **Shadcn/ui components** with Radix UI primitives

### State Management & Data
- **Zustand** for global state management
- **TanStack React Query** for server state and caching
- **Axios** with custom instance for API communication

### UI/UX Components
- **React Quill** for rich text editing
- **React Markdown** with GitHub Flavored Markdown support
- **Lucide React** for consistent iconography
- **React Toastify** for notifications
- **Formik + Yup** for form management and validation

### Backend Integration
- **Socket.io Client** for real-time communication
- **JWT Authentication** with secure token handling
- **REST API** integration with backend server

### Development Tools
- **ESLint** with Next.js configuration
- **Geist fonts** for typography
- **CSS Variables** with automatic theming

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Backend API server running on port 4700

### Environment Configuration
Create `.env.local` file:
```env
# API Configuration (Backend running on localhost:4700)
NEXT_PUBLIC_API_BASE_URL=http://localhost:4700/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4700

# Optional: Additional configuration
# Add other environment variables as needed for your backend integration
```

### Installation Steps
1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run development server**
   ```bash
   npm run dev
   # With Turbopack (faster builds)
   ```

3. **Open application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Architecture

### Directory Structure
```
src/
├── Components/              # Reusable UI components
│   ├── ai-assistant/       # AI chat interface components
│   ├── chat/              # Real-time chat system
│   ├── create-question/   # Question creation workflow
│   ├── dashboard/         # Admin dashboard components
│   │   └── tabs/         # Dashboard tab components
│   └── ui/               # Base UI components (Shadcn)
├── app/                   # Next.js App Router pages
│   ├── ai/               # AI assistant pages
│   ├── auth/             # Authentication flows
│   ├── chat/             # Chat interface
│   ├── dashboard/        # Admin dashboard
│   ├── discussion/       # Discussion forums
│   ├── login/            # Login page
│   ├── my-answer/        # User's answers
│   ├── my-questions/     # User's questions
│   ├── notifications/    # Notifications page
│   ├── profile/          # User profiles
│   ├── providers/        # React context providers
│   ├── questions/        # Q&A system
│   │   └── ask/         # Question creation
│   ├── register/         # User registration
│   └── saved-questions/  # Bookmarked questions
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── types/                 # TypeScript definitions
├── utils/                 # Helper functions
└── zustand/               # Global state stores
```

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full system access, user management, content moderation
- **User**: Can ask questions, provide answers, participate in discussions
- **Creator**: Enhanced privileges for content creation

### Auth Flow
- JWT-based authentication with automatic token refresh
- Protected route middleware with role-based access control
- Secure cookie handling with httpOnly flags
- Session management with automatic cleanup

### Security Features
- CSRF protection with SameSite cookies
- XSS protection with content sanitization
- Rate limiting on API endpoints
- Input validation with Yup schemas

## 🎯 Key Features Deep Dive

### AI Integration
- **Multiple Models**: DeepSeek R1 and Qwen 3 via backend server
- **Streaming Responses**: Real-time AI response streaming via WebSocket
- **Conversation Management**: Persistent chat history stored on backend
- **Context Awareness**: Maintains conversation context across sessions

### Search System
- **Advanced Filtering**: Sort by date, popularity, rating, answers
- **Tag-based Search**: Categorized content discovery  
- **Real-time Results**: Instant search with debouncing
- **Smart Suggestions**: AI-powered query suggestions

### Dashboard Analytics
- **User Metrics**: Registration trends, activity patterns
- **Content Stats**: Question/answer volumes, engagement rates
- **System Health**: Performance monitoring, error tracking
- **Administrative Tools**: User management, content moderation

### Real-time Features
- **Live Chat**: Global discussion rooms
- **Notifications**: Instant alerts for relevant activities
- **Typing Indicators**: Real-time user activity
- **Status Updates**: Online/offline presence

## 🚀 Available Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint checks
```

## 🔧 Configuration

### Shadcn/ui Setup
- **Style**: New York theme
- **Base Color**: Neutral palette
- **CSS Variables**: Enabled for theming
- **RSC**: React Server Components support

### API Integration
- Base URL: `http://localhost:4700/api`
- WebSocket: `http://localhost:4700`
- Credentials: Included for cross-origin requests

## 📱 User Interface

### Design System
- **Typography**: Geist Sans and Geist Mono fonts
- **Color Palette**: Blue primary, orange accent colors
- **Components**: Consistent design language with Shadcn/ui
- **Responsive**: Mobile-first design approach

### Key UI Components
- Advanced navigation with search integration
- Rich text editors for content creation
- Real-time chat interfaces
- Comprehensive admin dashboards
- Interactive data visualizations

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Implement changes with proper TypeScript typing
4. Add/update tests as needed
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open Pull Request

### Code Standards
- TypeScript strict mode enabled
- ESLint configuration enforced
- Consistent naming conventions
- Component documentation required
- Test coverage for new features

## 📄 License

This project is proprietary. All rights reserved.

## 🐛 Issues & Support

For bug reports, feature requests, or technical support, please contact the development team or create an issue in the project repository.

## 🔄 Version History

- **v0.1.0** - Initial release
  - Core Q&A functionality
  - User authentication system
  - Basic search capabilities
  - Admin dashboard foundation
  - AI assistant integration
  - Real-time chat system

---

**Built with modern web technologies for the research community** 🎓
