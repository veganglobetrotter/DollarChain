# Overview

This is a React-based invoice generation and management application built with Vite. The application is designed for processing WhatsApp order messages, parsing buyer information and order details, and generating PDF invoices. It integrates with Supabase for backend services including authentication and database storage.

The application processes natural language order messages (likely from WhatsApp), extracts structured data (buyer name, phone number, items, totals), and generates professional PDF invoices that are downloaded directly to users' computers.

# Recent Changes

**October 31, 2025 (Evening)**: Added "Save to Cloud" feature
- Implemented serverless API endpoint (`/api/upload-invoice`) for secure cloud storage
- Fixed formidable v3+ API compatibility issue (changed from `new formidable.IncomingForm()` to `formidable()`)
- Added SUPABASE_SERVICE_ROLE_KEY for server-side storage uploads with proper permissions
- Users can now optionally save invoices to cloud storage for future access

**October 31, 2025 (Morning)**: Simplified PDF download functionality
- Removed client-side Supabase Storage upload dependency to avoid RLS permission issues
- PDFs are now generated client-side and downloaded directly to users' computers by default
- Maintains backward compatibility for legacy invoices that have stored pdf_path
- Updated Vite configuration to bind to 0.0.0.0:5000 for optimal Replit compatibility

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack**: React 19 with Vite as the build tool and development server.

**Rationale**: Vite provides fast hot module replacement (HMR) and optimized builds. React 19 offers the latest features and performance improvements for building interactive UIs.

**Key Design Decisions**:
- Single-page application (SPA) architecture
- Component-based UI structure with a sidebar navigation layout
- CSS-based styling (App.css) with CSS custom properties for theming
- Configured for Replit hosting with specific server settings (host: 0.0.0.0, port: 5000)

**Styling Approach**: Custom CSS with design tokens defined in CSS variables. The design system uses a light color scheme with a contrasted sidebar layout, featuring a maximum content width of 1200px and consistent spacing/shadows.

## Backend Architecture

**Backend-as-a-Service**: Supabase is used for all backend functionality, eliminating the need for a custom server.

**Key Services**:
1. **Authentication**: User management through Supabase Auth
2. **Storage**: PDF invoice storage in a dedicated "invoices" bucket
3. **Database**: While not explicitly shown in the codebase, Supabase provides PostgreSQL database capabilities

**Rationale**: Using Supabase as a BaaS solution reduces infrastructure complexity, provides built-in authentication/authorization, and offers scalable file storage without managing servers.

## Data Processing Pipeline

**Order Message Parser** (`src/lib/parser.js`):
- Extracts structured data from natural language WhatsApp messages
- Uses `libphonenumber-js` for phone number parsing and validation
- Implements heuristic-based extraction for:
  - Buyer names (multiple pattern matching strategies)
  - Phone numbers (international format support)
  - Order items with quantities
  - Total amounts (supports multiple currency formats: KES, USD, etc.)
- Returns confidence scores for each extracted field

**Design Rationale**: Deterministic parsing with multiple fallback patterns ensures robust data extraction from unstructured text. Confidence scoring allows the UI to flag uncertain extractions for manual review.

## PDF Generation

**Library**: jsPDF with jspdf-autotable plugin

**Functionality** (`src/lib/pdf.js`):
- Generates professional PDF invoices with structured layout
- Includes header (seller name, invoice ID, date)
- Buyer information section
- Payment details
- Itemized order table
- Returns Blob for upload

**Rationale**: Client-side PDF generation eliminates server processing and allows immediate invoice preview/download. jsPDF is lightweight and well-maintained.

## PDF Download Architecture

**Download Strategy** (Client-side):
- PDFs are generated on-demand using jsPDF when users click "Download"
- Files are immediately downloaded to the user's computer via browser download
- No server-side storage required for new invoices (simplified approach)

**Legacy Storage Support** (`src/lib/storage.js`):
- Maintains backward compatibility for invoices with existing `pdf_path` values
- `createSignedUrl()` function generates temporary URLs for legacy stored PDFs
- Signed URLs provide time-limited access (default: 1 hour)
- Falls back to fresh PDF generation if signed URL fails

**Rationale**: Client-side download simplifies the architecture, eliminates storage permission issues, and provides instant PDF access without requiring Supabase storage bucket configuration or RLS policies.

## Code Quality & Linting

**ESLint Configuration**: 
- JavaScript-focused with React-specific rules
- React Hooks plugin for enforcing hooks best practices
- React Refresh plugin for Vite HMR compatibility
- Custom rule: allows unused variables if they match capital letter patterns (useful for React components)

# External Dependencies

## Third-Party Services

**Supabase** (Primary Backend):
- **Authentication**: User sign-up, login, session management
- **Database**: PostgreSQL for storing invoice records
- **Storage** (Legacy): Optional storage bucket for backward compatibility with older invoices
- **Configuration**: Requires environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## NPM Packages

**Core Framework**:
- `react` ^19.1.1 - UI framework
- `react-dom` ^19.1.1 - React DOM renderer
- `vite` ^7.1.7 - Build tool and dev server
- `@vitejs/plugin-react` ^5.0.4 - Vite React integration

**Supabase Integration**:
- `@supabase/supabase-js` ^2.78.0 - Supabase JavaScript client

**Utility Libraries**:
- `libphonenumber-js` ^1.12.25 - Phone number parsing and validation (international format support)
- `jspdf` ^3.0.3 - PDF generation library
- `jspdf-autotable` ^5.0.2 - Table plugin for jsPDF (invoice line items)

**Development Tools**:
- `eslint` ^9.36.0 - Code linting
- `eslint-plugin-react-hooks` ^5.2.0 - React Hooks linting rules
- `eslint-plugin-react-refresh` ^0.4.22 - React Fast Refresh linting
- `@eslint/js` ^9.36.0 - ESLint JavaScript rules

## Deployment Platform

**Replit**:
- Configured in `vite.config.js` with Replit-specific host allowances
- Server binds to 0.0.0.0:5000 for Replit webview compatibility
- Allows hosts: `.replit.dev`, `.repl.co`

## Environment Configuration

Required environment variables (via `.env` file or Replit Secrets):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public API key