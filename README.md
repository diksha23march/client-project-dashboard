# Real-Time Client Project Dashboard

A full-stack role-based project management dashboard built with React, TypeScript, Node.js, Express, PostgreSQL, JWT authentication, and Socket.IO.

The application allows administrators, project managers, and developers to interact with projects and tasks according to their assigned roles.

## Features

### Authentication
- User registration and login
- JWT access-token authentication
- Refresh-token support
- Refresh token stored in an HttpOnly cookie
- Automatic access-token refresh on the frontend
- Protected backend API routes

### Role-Based Access Control

#### Admin
- View projects and tasks
- Access user information
- Create and manage projects
- Add developers to projects
- Create and assign tasks
- View activity

#### Project Manager
- View projects managed by them
- Add developers to their projects
- Create and assign tasks
- View tasks belonging to their projects
- View team activity

#### Developer
- View projects they belong to
- View only tasks assigned to them
- Update the status of their assigned tasks
- View relevant activity

Role restrictions are enforced on the backend using authentication and authorization middleware.

## Task Management

Tasks support:

- Title and description
- Priority: LOW, MEDIUM, HIGH
- Status: TODO, IN_PROGRESS, COMPLETED
- Project assignment
- Developer assignment
- Activity tracking

## Real-Time Updates

Socket.IO is used to provide real-time task updates.

When task information or status changes, connected dashboards can receive the update without manually refreshing the page.

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
- Socket.IO
- JWT
- bcrypt
- cookie-parser

### Database
- PostgreSQL
- pg

## Project Structure

```text
client-project-dashboard/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.tsx
│   │   └── App.css
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── index.ts
│   └── package.json
│
├── .gitignore
└── README.md
```

## Environment Variables

Create a `.env` file inside the `server` directory.

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=client_project_dashboard
DB_USER=postgres
DB_PASSWORD=your_postgresql_password

JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
```

Do not commit the `.env` file to Git.

## Running the Project

### 1. Install Frontend Dependencies

```bash
cd client
npm install
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Start Backend

From the `server` directory:

```bash
npm run dev
```

The API runs at:

```text
http://localhost:5000
```

### 4. Start Frontend

From the `client` directory:

```bash
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## Security

- Passwords are hashed using bcrypt.
- Refresh tokens are stored in HttpOnly cookies.
- Protected routes require JWT authentication.
- Role authorization is enforced at the API level.
- Developers cannot access tasks assigned to other developers.
- Project Managers are restricted to projects they manage.

## Production Build

The React frontend can be built using:

```bash
npm run build
```

The project has been verified with a successful TypeScript and Vite production build.