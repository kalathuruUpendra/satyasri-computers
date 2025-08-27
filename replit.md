# Overview

This is a service center management system for SATYASRI COMPUTERS. It's a full-stack web application built to manage device repair tickets, customer information, and technician workflows. The system handles the complete lifecycle of device repairs from initial customer submission through completion and delivery.

The application supports two user roles: front desk staff who handle customer interactions and ticket management, and technicians who work on repairs and update service status. It includes features for ticket creation, status tracking, customer communication via WhatsApp/SMS, and reporting.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React and TypeScript, using Vite as the build tool. It follows a component-based architecture with:

- **UI Framework**: shadcn/ui components built on Radix UI primitives for consistent design
- **Styling**: Tailwind CSS with CSS variables for theming support
- **State Management**: TanStack Query for server state and local React state for UI state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: JWT token-based authentication with localStorage persistence

The frontend is organized into pages, components, hooks, and utilities with path aliases configured for clean imports.

## Backend Architecture
The server uses Express.js with TypeScript and follows a REST API pattern:

- **API Structure**: RESTful endpoints under `/api` namespace
- **Authentication**: JWT middleware with role-based access control (frontdesk/technician)
- **Data Validation**: Zod schemas shared between client and server
- **Error Handling**: Centralized error middleware with structured responses
- **Development Setup**: Vite integration for hot reloading in development

## Data Storage
The application uses a dual storage approach:

- **Development**: In-memory storage with default users and data persistence simulation
- **Production**: PostgreSQL database with Drizzle ORM for type-safe database operations
- **Schema**: Relational design with users, customers, and tickets tables
- **Migrations**: Drizzle Kit for database schema management

Key entities include:
- Users (frontdesk staff and technicians with role-based permissions)
- Customers (contact information and service history)
- Tickets (repair jobs with status tracking, cost management, and service notes)

## External Dependencies

### Database & ORM
- **Neon Database**: Serverless PostgreSQL for production data storage
- **Drizzle ORM**: Type-safe database queries and schema management
- **Drizzle Kit**: Database migration and schema synchronization tools

### UI & Styling
- **Radix UI**: Headless component primitives for accessibility and behavior
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **shadcn/ui**: Pre-built component library with consistent styling
- **Lucide React**: Icon library for UI elements

### Authentication & Security  
- **jsonwebtoken**: JWT token generation and verification
- **bcrypt**: Password hashing and verification for secure authentication

### Communication Features
- **WhatsApp/SMS Integration**: Planned external service integration for customer notifications
- **Message Templates**: Automated communication for repair status updates

### Development Tools
- **Replit Integration**: Development environment optimization with error overlays and cartographer
- **TypeScript**: Full-stack type safety with shared schemas
- **ESBuild**: Fast bundling for production builds