# Client Project Dashboard

A full-stack role-based project and task management dashboard with real-time updates.

## Live Application

Frontend: https://client-project-dashboard-seven-lac.vercel.app

Backend API: https://client-project-dashboard-api.vercel.app

## Repository

https://github.com/diksha23march/client-project-dashboard

## Features

- JWT-based authentication with access and refresh tokens
- Refresh token stored in an HttpOnly cookie
- Three roles:
  - **Admin** — full access
  - **Project Manager** — create/manage projects, add developers, create and assign tasks, and view activity for managed projects
  - **Developer** — view assigned tasks and update task status
- Backend-enforced role-based authorization
- Project membership management
- Task creation, assignment, priority, and status tracking
- Activity logging
- Real-time refresh using Socket.IO
- PostgreSQL database hosted on Neon
- Deployed frontend and backend on Vercel

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Socket.IO Client
- CSS

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- `pg`
- Socket.IO
- JWT
- bcrypt
- cookie-parser
- CORS

### Infrastructure
- Neon PostgreSQL
- Vercel
- GitHub

## Project Structure

```text
client-project-dashboard/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.ts
│   ├── package.json
│   └── vercel.json
│
├── .gitignore
└── README.md
```

## Local Setup

### Prerequisites

Install:

- Node.js
- npm
- PostgreSQL, or use a hosted PostgreSQL database such as Neon

### 1. Clone the repository

```bash
git clone https://github.com/diksha23march/client-project-dashboard.git
cd client-project-dashboard
```

### 2. Backend setup

```bash
cd server
npm install
```

Create a `.env` file inside `server/`:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

The API runs at:

```text
http://localhost:5000
```

Database test endpoint:

```text
http://localhost:5000/api/db-test
```

### 3. Frontend setup

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

The frontend uses `http://localhost:5000` as a fallback backend URL during local development.

For a custom backend URL, create `client/.env`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

## Database Schema

The application uses five core tables:

### `users`
Stores user accounts, password hashes, roles, and timestamps.

### `projects`
Stores project information, project creator, and project manager.

### `project_members`
Many-to-many relationship between users and projects.

### `tasks`
Stores task title, description, status, priority, project, assignee, creator, updater, due date, and timestamps.

### `activity_logs`
Stores user actions associated with projects and tasks.

### Relationship overview

```text
users
  ├── creates/manages ──> projects
  ├── belongs to ───────> projects through project_members
  └── assigned to ──────> tasks

projects
  ├── has many ─────────> project_members
  ├── has many ─────────> tasks
  └── has many ─────────> activity_logs

tasks
  └── has many ─────────> activity_logs
```

## Roles and Authorization

Authorization is enforced on the backend, not only in the UI.

### Admin
- Full project access
- Full task access
- Can manage project members
- Can view all activity

### Project Manager
- Can create projects
- Can manage projects they are responsible for
- Can add developers to projects
- Can create and assign tasks
- Can view activity for their projects

### Developer
- Can view only assigned tasks
- Can update the status of assigned tasks
- Cannot view other developers' tasks

## Authentication Design

The application uses two JWTs:

- **Access token** — short-lived, expires in 15 minutes
- **Refresh token** — expires in 7 days

The refresh token is stored in an **HttpOnly cookie**.

For local development the cookie uses:

- `secure: false`
- `sameSite: "lax"`

For production it uses:

- `secure: true`
- `sameSite: "none"`

The frontend retries requests with a refreshed access token when the access token has expired.

## Real-Time Design

Socket.IO is used for real-time notifications.

Instead of broadcasting complete task objects to every connected user, the backend emits a generic:

```text
tasks-changed
```

event.

When the client receives this event, it refetches data from the protected REST API. The REST endpoints apply role-based filtering before returning data.

This avoids exposing task details through the WebSocket channel and keeps authorization centralized in the backend.

## Architectural Decisions

### Why Socket.IO?

Socket.IO was selected because it provides:

- bidirectional communication
- automatic reconnection
- a simple event-based API
- convenient integration with Express and React

### Why PostgreSQL?

The project contains strongly related data such as users, projects, project memberships, tasks, and activity logs. PostgreSQL provides relational integrity and foreign-key support that fit this model well.

### Token storage approach

The access token is stored in localStorage and the refresh token is stored in an HttpOnly cookie.

This keeps the refresh token inaccessible to frontend JavaScript while allowing the application to refresh short-lived access tokens.

For a larger production application, a memory-only access token or Backend-for-Frontend architecture would further reduce exposure to XSS.

### Job queue choice

A background job queue was not added because the current project does not contain long-running or asynchronous jobs that require queue processing.

Database writes and activity logs are lightweight and are handled synchronously.

If the system later adds email delivery, scheduled reports, notifications, or heavy background processing, a queue such as BullMQ with Redis would be appropriate.

## Security Measures

- Passwords hashed using bcrypt
- Short-lived JWT access tokens
- HttpOnly refresh-token cookie
- Role authorization middleware
- Protected API routes
- Parameterized PostgreSQL queries
- CORS configured for the frontend origin
- Task data is not broadcast directly through Socket.IO

## Production Deployment

### Backend
Deployed on Vercel:

```text
https://client-project-dashboard-api.vercel.app
```

Production environment variables:

```text
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
CLIENT_URL
```

### Frontend
Deployed on Vercel:

```text
https://client-project-dashboard-seven-lac.vercel.app
```

Frontend environment variable:

```text
VITE_BACKEND_URL=https://client-project-dashboard-api.vercel.app
```

## Production Build

Frontend:

```bash
cd client
npm run build
```

## Known Limitations

- Different accounts opened in multiple tabs of the same browser share localStorage, so their access tokens can overwrite each other. Use separate browsers or incognito sessions when testing different roles simultaneously.
- Socket.IO currently broadcasts a generic change notification to connected clients. The notification contains no task data, and protected APIs still enforce authorization. A larger system could use authenticated per-user or per-project Socket.IO rooms.
- Password reset and email verification are not implemented.
- Pagination and advanced filtering are not implemented.
- Some backend task-management operations may not yet have dedicated UI controls.
- A Docker setup is not currently included; local setup uses npm and PostgreSQL/Neon directly.
- A background job queue is not included because the current scope does not require long-running jobs.

## Demo Accounts

For assessment/testing:

```text
Admin
Email: admin@test.com
Password: Test1234

Project Manager
Email: manager@test.com
Password: Test1234

Developer
Email: developer@test.com
Password: Test1234
```

Use separate browser sessions when testing multiple roles at the same time.

## Author

Diksha