const API_URL = "http://localhost:5000/api";

// ============================================
// REFRESH ACCESS TOKEN
// ============================================

const refreshAccessToken = async () => {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    throw new Error(
      data.message || "Session expired. Please login again."
    );
  }

  localStorage.setItem(
    "accessToken",
    data.accessToken
  );

  return data.accessToken;
};

// ============================================
// GENERAL AUTHENTICATED REQUEST
// Automatically refreshes expired access token
// ============================================

const authenticatedRequest = async (
  url: string,
  options: RequestInit = {},
  token?: string
) => {
  // Always prefer the latest token stored in localStorage.
  let accessToken =
    localStorage.getItem("accessToken") || token || "";

  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set(
      "Authorization",
      `Bearer ${accessToken}`
    );
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  let data = await response.json();

  // Our backend uses this message when JWT is expired/invalid.
  if (
    response.status === 403 &&
    data.message === "Invalid or expired access token"
  ) {
    accessToken = await refreshAccessToken();

    headers.set(
      "Authorization",
      `Bearer ${accessToken}`
    );

    response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    data = await response.json();
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Request failed"
    );
  }

  return data;
};

// ============================================
// LOGIN
// ============================================

export const login = async (
  email: string,
  password: string
) => {
  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",

      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Login failed"
    );
  }

  return data;
};

// ============================================
// GET PROJECTS
// ============================================

export const getProjects = async (
  token: string
) => {
  return authenticatedRequest(
    `${API_URL}/projects`,
    {
      method: "GET",
    },
    token
  );
};

// ============================================
// GET TASKS
// ============================================

export const getTasks = async (
  token: string
) => {
  return authenticatedRequest(
    `${API_URL}/tasks`,
    {
      method: "GET",
    },
    token
  );
};

// ============================================
// GET ACTIVITIES
// ============================================

export const getActivities = async (
  token: string
) => {
  return authenticatedRequest(
    `${API_URL}/activities`,
    {
      method: "GET",
    },
    token
  );
};

// ============================================
// GET USERS
// ADMIN / PROJECT MANAGER
// ============================================

export const getUsers = async (
  token: string
) => {
  return authenticatedRequest(
    `${API_URL}/users`,
    {
      method: "GET",
    },
    token
  );
};

// ============================================
// ADD PROJECT MEMBER
// ============================================

export const addProjectMember = async (
  token: string,
  projectId: number,
  userId: number
) => {
  return authenticatedRequest(
    `${API_URL}/projects/${projectId}/members`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        userId,
      }),
    },
    token
  );
};

// ============================================
// CREATE TASK
// ============================================

export const createTask = async (
  token: string,
  taskData: {
    title: string;
    description: string;
    priority: string;
    projectId: number;
    assignedTo: number;
  }
) => {
  return authenticatedRequest(
    `${API_URL}/tasks`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(taskData),
    },
    token
  );
};

// ============================================
// UPDATE TASK STATUS
// ============================================

export const updateTaskStatus = async (
  token: string,
  taskId: number,
  status: string
) => {
  return authenticatedRequest(
    `${API_URL}/tasks/${taskId}/status`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        status,
      }),
    },
    token
  );
};