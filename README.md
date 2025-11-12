# Clinic Website Platform

This repo now includes a static, easily customizable public website for international clients. It can be hosted on any static host (GitHub Pages, Netlify, Vercel, S3) and edited via JSON files.

## Quick Start (Static Site)

1. Open `index.html` in a browser (or serve locally to allow fetch of JSON files):
   - Python: `python -m http.server 5500`
   - Node: `npx serve .`
2. Edit content in `data/*.json` to update pages without touching HTML.
3. Add images/videos by using URLs (e.g., Google Drive public, S3, YouTube/Vimeo).

### Structure

```
assets/
  css/styles.css         # theme and responsive styles
  js/layout.js           # shared header/footer from data/site.json
  js/animation.js        # 3D-like abstract canvas background for homepage
  js/content.js          # loads JSON content into each page
data/
  site.json              # site name, nav, footer links
  home.json              # homepage features + video embeds
  doctors.json           # doctors list with photos and interviews
  services.json          # services and brief descriptions
  achievements.json      # milestones
  kidney.json            # kidney transplant department highlights
  about.json             # about page links
  reviews.json           # Google review snippets and place URL
```

### Customization

- Change branding and navigation in `data/site.json`.
- Add/edit doctors in `data/doctors.json` (supports photoUrl and interviewUrl).
- Update procedures/services in `data/services.json`.
- Add videos on the homepage via `data/home.json` `showcase.videos[*].embedUrl`.
- Replace the Google Maps embed in `assets/js/content.js` (contact section) with your clinic location link if desired.
- Replace placeholder YouTube links with your actual interviews/tours.

### Pages

- `index.html`: Attractive homepage with animated canvas background and highlights.
- `doctors.html`: Doctors with details and interviews.
- `services.html`: Services/procedures overview.
- `achievements.html`: Clinic milestones and stats.
- `kidney.html`: Kidney transplant department page.
- `about.html`: About us with relevant links.
- `contact.html`: Contact/appointment form and map.
- `reviews.html`: Google review snippets and link to full page.

### Notes

- For fetch to load JSON files, serve the folder over HTTP (file:// may block fetch in some browsers). Use one of the quick commands under Quick Start.
- The static site can later be upgraded to the full Next.js stack described below (admin, auth, DB, APIs) when needed.
- Public website showcasing doctors, services, procedures, videos, patient experiences, and testimonials
- Admin panel to add/remove/edit doctors, services, procedure videos, and patient experiences/testimonials
- Secure authentication and role-based access control (RBAC)
- Scalable backend, performant frontend, and production-ready deployment

## Goals
- Provide a modern, responsive, SEO-friendly clinic website
- Enable admins to manage content (doctors, services, videos, patient experiences/testimonials) without developer involvement
- Ensure content moderation, drafts, and safe publishing
- Provide analytics, audit logs, and backups for reliability

## Non-Goals (initial release)
- Complex scheduling/appointments with EMR integration
- Payment processing and billing
- Multi-tenant clinics
- Native mobile apps

## Tech Stack

- Frontend: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js API routes (or NestJS alternative later) + TypeScript
- Database: PostgreSQL (via Prisma ORM)
- Auth: NextAuth.js (Credentials/Email + optional OAuth), RBAC
- Storage:
  - Images: AWS S3 (or Cloudflare R2) via pre-signed URLs
  - Videos: YouTube/Vimeo embeds or S3/R2 for short MP4s (configurable)
- Caching: Redis (optional; for page caching and rate limiting)
- Search: Postgres full-text search (phase 1), optional OpenSearch/Algolia (phase 2)
- Infrastructure: Vercel (frontend + serverless API) or Docker + Fly.io/Render; PostgreSQL via Neon/Supabase/RDS
- Observability: Sentry (errors), Logtail/Datadog (logs), Plausible/GA4 (analytics)
- Emails: Resend/SendGrid for admin notifications and email sign-in (optional)
- CI/CD: GitHub Actions
- Testing: Playwright (E2E), Vitest/RTL (unit/component), Prisma test DB

## High-Level Architecture

- Next.js App:
  - Public pages: Home, Doctors, Services, Procedures, Videos, Patient Experiences, Testimonials, Contact
  - Dynamic pages for doctor profiles and service details
  - Static generation (SSG) with ISR for performance; server-side rendering (SSR) for personalized/admin pages
- Admin Panel (protected routes under `/admin`):
  - Dashboard with content counts and recent activity
  - CRUD for doctors, services, videos, experiences/testimonials
  - Draft/publish workflow; media upload via pre-signed URLs
  - Audit logs and role management
- API Layer:
  - RESTful routes under `/api/*` (or tRPC if preferred)
  - Auth guard middleware and per-route RBAC
  - Pagination, filtering, and sorting
- Database Layer:
  - Prisma schema with relational models
  - Soft-deletes for safety
  - Migration scripts managed via Prisma

## Data Model (initial Prisma sketch)

- User: id, name, email, role ['ADMIN','EDITOR','VIEWER'], passwordHash (if using credentials), createdAt, updatedAt
- Doctor: id, name, title, specialization, bio, photoUrl, isFeatured, socialLinks(json), createdAt, updatedAt, publishedAt, status ['DRAFT','PUBLISHED','ARCHIVED']
- Service: id, name, slug, summary, description, coverImageUrl, gallery(json[]), createdAt, updatedAt, publishedAt, status
- ProcedureVideo: id, title, description, videoUrl (YouTube/Vimeo/S3), thumbnailUrl, relatedServiceId, createdAt, updatedAt, publishedAt, status
- PatientExperience: id, patientName(or alias), title, body, mediaUrls(json[]), createdAt, updatedAt, publishedAt, status
- Testimonial: id, authorName, authorMeta, rating(int 1-5), quote, avatarUrl, createdAt, updatedAt, publishedAt, status
- AuditLog: id, userId, action, entityType, entityId, before(json), after(json), createdAt

Notes:
- Status enables draft/publish/archive workflow
- Soft delete via status 'ARCHIVED' or dedicated `deletedAt`
- Text search indexes on relevant fields
- Slugs for SEO on services and doctors

## Core API Endpoints (representative)

- Auth:
  - POST /api/auth/signin
  - POST /api/auth/signout
  - GET /api/auth/session
- Doctors:
  - GET /api/doctors?status=PUBLISHED&search=&page=&limit=
  - GET /api/doctors/:id or /api/doctors/slug/:slug
  - POST /api/doctors (ADMIN/EDITOR)
  - PUT /api/doctors/:id (ADMIN/EDITOR)
  - DELETE /api/doctors/:id (ADMIN)
  - POST /api/doctors/:id/publish (ADMIN/EDITOR)
- Services:
  - GET /api/services?status=PUBLISHED&search=
  - GET /api/services/:id or /api/services/slug/:slug
  - POST /api/services
  - PUT /api/services/:id
  - DELETE /api/services/:id
  - POST /api/services/:id/publish
- Procedure Videos:
  - GET /api/videos?serviceId=&status=
  - POST /api/videos
  - PUT /api/videos/:id
  - DELETE /api/videos/:id
  - POST /api/videos/:id/publish
- Patient Experiences:
  - GET /api/experiences?status=
  - POST /api/experiences
  - PUT /api/experiences/:id
  - DELETE /api/experiences/:id
  - POST /api/experiences/:id/publish
- Testimonials:
  - GET /api/testimonials?status=
  - POST /api/testimonials
  - PUT /api/testimonials/:id
  - DELETE /api/testimonials/:id
  - POST /api/testimonials/:id/publish
- Media:
  - POST /api/media/upload-url (get pre-signed URL)
- Admin:
  - GET /api/admin/stats
  - GET /api/admin/audit-logs

All POST/PUT protected by CSRF + Auth + RBAC. Rate limiting on public endpoints if needed.

## Admin Panel Features

- Login (email/password or email link). Support passwordless email link if preferred.
- Content lists with filters (status, search) and pagination
- Editor forms with validation and image/video upload
- Draft -> Publish -> Archive workflow
- Preview mode for draft content
- Audit log for each change (who/what/when)
- Role management (only ADMIN can assign roles)

## Media and Video Strategy

- Images:
  - Upload via pre-signed S3 URLs
  - Optimize via Next.js Image Optimization
- Videos:
  - Prefer YouTube/Vimeo embeds for long videos to offload bandwidth
  - Support direct MP4 upload for short clips (< 100MB) to S3/R2
  - Store provider type and URL in DB

## SEO, Accessibility, and Performance

- SEO: metadata, dynamic Open Graph, sitemaps, structured data (JSON-LD), canonical URLs
- Accessibility: keyboard navigation, aria attributes, color contrast
- Performance: ISR/SSG, CDN caching, image optimization, code splitting, prefetching
- Internationalization: optional (phase 2) via next-intl

## Security

- HTTPS everywhere, secure cookies
- NextAuth with session hardening and CSRF
- Input validation (Zod) server/client
- RBAC middleware
- Rate limiting (Redis) for sensitive endpoints
- Content sanitization for rich text (if added later)

## Project Structure (Next.js)

```
/app
  /(public)              # public pages
  /admin                 # admin panel (protected)
  /api                   # API route handlers
/components              # shared UI components
/lib                     # utils (auth, rbac, validation, storage, cache)
/styles                  # globals, tailwind
/prisma                  # schema and migrations
/tests                   # e2e and unit tests
```

## Environment Variables

- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_REGION
- VIDEO_PROVIDER (youtube|vimeo|s3)
- SENTRY_DSN (optional)
- REDIS_URL (optional)
- EMAIL_PROVIDER_* (optional)

## Implementation Plan

1) Project Bootstrap
- Initialize Next.js + TypeScript + Tailwind + Prisma
- Configure linting, formatting, and CI

2) Database and Auth
- Define Prisma schema
- Set up NextAuth with credentials/email provider
- Seed admin user

3) Public Website
- Build pages: Home, Doctors, Services, Procedures, Videos, Experiences, Testimonials, Contact
- Implement search/filter for doctors/services
- SEO and structured data

4) Admin Panel
- Protect routes with auth middleware
- CRUD interfaces for doctors, services, videos, experiences/testimonials
- Media uploads with pre-signed URLs
- Draft/publish/archive workflow
- Audit logs

5) API Layer
- Implement REST handlers with Zod validation and RBAC
- Pagination, sort, search
- Unit tests for services/handlers

6) Observability and Hardening
- Error tracking (Sentry), logging
- Rate limiting for public endpoints
- Backups/retention policy

7) Testing and QA
- Unit tests, integration tests, E2E (Playwright) for key flows
- Accessibility and performance checks

8) Deployment
- Provision database (Neon/Supabase)
- Configure S3/R2 bucket and env vars
- Deploy to Vercel (or Docker to Fly/Render)
- Set up domain, SSL, analytics

## Testing Strategy

- Unit: services, utils, validators
- Integration: API routes with test DB
- E2E: Admin CRUD flows, publish workflows, public browsing
- Accessibility tests and Lighthouse CI

## Deployment Checklist

- Env vars set in hosting provider
- Database migrated
- Storage bucket configured
- Admin account created
- Analytics and error tracking enabled
- Cache/ISR rules verified
- Backups configured

## Maintenance

- Regular dependency updates
- Security patches
- Weekly DB backups and restore drills
- Audit log retention and pruning
- Rotate secrets regularly

## Roadmap (post-MVP)

- Appointment booking and reminders
- Rich text editor with content blocks
- Multi-language support
- Advanced search and tagging
- Roles beyond ADMIN/EDITOR/VIEWER
- Patient portal (phase 3)

## License
Private (proprietary) unless specified otherwise.


