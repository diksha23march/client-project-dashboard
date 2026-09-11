-- CLIENT PROJECT DASHBOARD - DATABASE SCHEMA


-- ENUM TYPES

CREATE TYPE user_role AS ENUM (
  'ADMIN',
  'PROJECT_MANAGER',
  'DEVELOPER'
);

CREATE TYPE task_status AS ENUM (
  'TODO',
  'IN_PROGRESS',
  'COMPLETED'
);

CREATE TYPE task_priority AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH'
);


-- USERS

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- PROJECTS

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,

  name VARCHAR(150) NOT NULL,

  description TEXT,

  created_by INTEGER NOT NULL,

  manager_id INTEGER,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_projects_created_by
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE RESTRICT,

  CONSTRAINT fk_projects_manager
    FOREIGN KEY (manager_id)
    REFERENCES users(id)
    ON DELETE SET NULL
);


-- PROJECT MEMBERS

CREATE TABLE project_members (
  project_id INTEGER NOT NULL,

  user_id INTEGER NOT NULL,

  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (project_id, user_id),

  CONSTRAINT fk_project_members_project
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_project_members_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);


-- TASKS

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,

  title VARCHAR(150) NOT NULL,

  description TEXT,

  status task_status NOT NULL DEFAULT 'TODO',

  priority task_priority NOT NULL DEFAULT 'MEDIUM',

  project_id INTEGER NOT NULL,

  assigned_to INTEGER,

  created_by INTEGER NOT NULL,

  updated_by INTEGER,

  due_date DATE,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_tasks_project
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_tasks_assigned_to
    FOREIGN KEY (assigned_to)
    REFERENCES users(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_tasks_created_by
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE RESTRICT,

  CONSTRAINT fk_tasks_updated_by
    FOREIGN KEY (updated_by)
    REFERENCES users(id)
    ON DELETE SET NULL
);


-- ACTIVITY LOGS

CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,

  user_id INTEGER,

  project_id INTEGER,

  task_id INTEGER,

  action VARCHAR(100) NOT NULL,

  details TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_activity_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_activity_project
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_activity_task
    FOREIGN KEY (task_id)
    REFERENCES tasks(id)
    ON DELETE CASCADE
);


-- INDEXES

CREATE INDEX idx_users_role
ON users(role);

CREATE INDEX idx_projects_manager_id
ON projects(manager_id);

CREATE INDEX idx_projects_created_by
ON projects(created_by);

CREATE INDEX idx_project_members_user_id
ON project_members(user_id);

CREATE INDEX idx_tasks_project_id
ON tasks(project_id);

CREATE INDEX idx_tasks_assigned_to
ON tasks(assigned_to);

CREATE INDEX idx_tasks_status
ON tasks(status);

CREATE INDEX idx_tasks_priority
ON tasks(priority);

CREATE INDEX idx_activity_logs_user_id
ON activity_logs(user_id);

CREATE INDEX idx_activity_logs_project_id
ON activity_logs(project_id);

CREATE INDEX idx_activity_logs_task_id
ON activity_logs(task_id);

CREATE INDEX idx_activity_logs_created_at
ON activity_logs(created_at);