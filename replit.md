# نظام إدارة المستشفى (Hospital Management System)

## Overview

This is a comprehensive Arabic hospital management system built with modern web technologies. The system provides a complete solution for managing patients, staff, finances, and operations with a focus on the Arabic-speaking market.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive styling
- **Shadcn/ui** components for consistent UI design
- **React Query** for efficient data fetching and state management
- **Wouter** for lightweight client-side routing
- **React Hook Form** with Zod validation for form handling
- **Vite** as the build tool for fast development

### Backend Architecture
- **Node.js** with Express.js framework
- **TypeScript** for server-side type safety
- **Drizzle ORM** with PostgreSQL for database operations
- **Firebase Firestore** as the primary database
- **JWT-based authentication** system
- **RESTful API** design pattern

### Database Strategy
- **Firebase Firestore** for document-based storage
- Structured collections for patients, staff, expenses, payments, and users
- Real-time synchronization capabilities
- Scalable NoSQL architecture

## Key Components

### 1. Patient Management System
- Patient registration and profile management
- Admission and discharge tracking
- Room assignment and occupancy management
- Insurance and billing integration
- Cigarette consumption tracking for detox/recovery patients

### 2. Staff Management
- Employee profiles and role-based access control
- Department organization
- Salary and payroll management
- Performance tracking

### 3. Financial Management
- Expense tracking and categorization
- Payment collection and processing
- Revenue reporting and analytics
- Daily financial summaries

### 4. Payroll System
- Monthly salary calculations
- Bonus and advancement tracking
- Deduction management
- Comprehensive payroll reports

### 5. Cigarette Management
- Daily cigarette allocation for patients
- Cost tracking and billing
- Support for detox and recovery programs

### 6. User Management & Security
- Role-based access control (Admin, Doctor, Nurse, Receptionist, Accountant)
- Permission-based system for granular access
- User authentication and session management

## Data Flow

1. **Client-Server Communication**: RESTful API endpoints with JSON payloads
2. **Authentication Flow**: JWT tokens stored in localStorage with server-side validation
3. **Data Synchronization**: Real-time updates through Firebase Firestore listeners
4. **State Management**: React Query for server state, React hooks for local state
5. **Form Handling**: React Hook Form with Zod validation before API calls

## External Dependencies

### Core Libraries
- React ecosystem (React, React DOM, React Query)
- UI components (Radix UI, Shadcn/ui)
- Styling (Tailwind CSS, class-variance-authority)
- Forms (React Hook Form, Hookform resolvers)
- Date handling (date-fns)
- PDF generation (jsPDF)
- Excel handling (react-dropzone, xlsx)

### Firebase Integration
- Firebase SDK for authentication and Firestore
- Real-time database synchronization
- Cloud storage capabilities

### Development Tools
- TypeScript for type safety
- Vite for build optimization
- ESBuild for server bundling
- Drizzle Kit for database management

## Deployment Strategy

### Production Setup
- **Render.com** deployment configuration
- Environment variables for Firebase configuration
- Automated builds with npm scripts
- PostgreSQL database provisioning
- Static file serving with Express

### Build Process
1. Frontend: Vite builds React app to `dist/public`
2. Backend: ESBuild bundles server code to `dist/index.js`
3. Database: Drizzle handles schema migrations
4. Assets: Static files served from Express

### Environment Configuration
- Firebase credentials via environment variables
- Database connection strings
- Production/development environment detection

## Changelog
- June 14, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.