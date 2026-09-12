import { useEffect, useState } from "react";

import {
  addProjectMember,
  createProject,
  createTask,
  getActivities,
  getProjectMembers,
  getProjects,
  getTasks,
  getUsers,
  updateTaskStatus,
} from "../services/api";

import socket from "../services/socket";

interface DashboardProps {
  token: string;
  user: any;
  onLogout: () => void;
}

function Dashboard({
  token,
  user,
  onLogout,
}: DashboardProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [projectMembers, setProjectMembers] =
    useState<any[]>([]);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ============================================
  // PROJECT FORM
  // ============================================

  const [projectName, setProjectName] =
    useState("");

  const [projectDescription, setProjectDescription] =
    useState("");

  // ============================================
  // ADD MEMBER FORM
  // ============================================

  const [memberProjectId, setMemberProjectId] =
    useState("");

  const [memberUserId, setMemberUserId] =
    useState("");

  // ============================================
  // TASK FORM
  // ============================================

  const [taskTitle, setTaskTitle] =
    useState("");

  const [taskDescription, setTaskDescription] =
    useState("");

  const [taskPriority, setTaskPriority] =
    useState("MEDIUM");

  const [taskProjectId, setTaskProjectId] =
    useState("");

  const [taskAssignedTo, setTaskAssignedTo] =
    useState("");

  // ============================================
  // LOAD DASHBOARD
  // ============================================

  const loadData = async () => {
    try {
      setError("");

      const projectData =
        await getProjects(token);

      const taskData =
        await getTasks(token);

      const activityData =
        await getActivities(token);

      setProjects(
        projectData.projects || []
      );

      setTasks(
        taskData.tasks || []
      );

      setActivities(
        activityData.activities || []
      );

      if (
        user.role === "ADMIN" ||
        user.role === "PROJECT_MANAGER"
      ) {
        const userData =
          await getUsers(token);

        setUsers(
          userData.users || []
        );
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  // ============================================
  // INITIAL LOAD + SOCKET
  // ============================================

  useEffect(() => {
    loadData();

    socket.connect();

    socket.on(
      "tasks-changed",
      loadData
    );

    return () => {
      socket.off(
        "tasks-changed",
        loadData
      );

      socket.disconnect();
    };
  }, []);

  // ============================================
  // LOAD MEMBERS WHEN TASK PROJECT CHANGES
  // ============================================

  useEffect(() => {
    const loadMembers = async () => {
      if (!taskProjectId) {
        setProjectMembers([]);
        setTaskAssignedTo("");
        return;
      }

      try {
        setError("");

        const data =
          await getProjectMembers(
            token,
            Number(taskProjectId)
          );

        setProjectMembers(
          data.members || []
        );

        setTaskAssignedTo("");
      } catch (err) {
        setProjectMembers([]);

        if (err instanceof Error) {
          setError(err.message);
        }
      }
    };

    loadMembers();
  }, [taskProjectId]);

  // ============================================
  // CREATE PROJECT
  // ============================================

  const handleCreateProject = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      await createProject(token, {
        name: projectName,
        description:
          projectDescription,
      });

      setMessage(
        "Project created successfully."
      );

      setProjectName("");
      setProjectDescription("");

      await loadData();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  // ============================================
  // ADD MEMBER
  // ============================================

  const handleAddMember = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      await addProjectMember(
        token,
        Number(memberProjectId),
        Number(memberUserId)
      );

      setMessage(
        "Developer added to project successfully."
      );

      // If this project is currently selected
      // in Create Task, refresh its members.
      if (
        memberProjectId ===
        taskProjectId
      ) {
        const data =
          await getProjectMembers(
            token,
            Number(taskProjectId)
          );

        setProjectMembers(
          data.members || []
        );
      }

      setMemberProjectId("");
      setMemberUserId("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  // ============================================
  // CREATE TASK
  // ============================================

  const handleCreateTask = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      await createTask(token, {
        title: taskTitle,
        description:
          taskDescription,
        priority:
          taskPriority,
        projectId:
          Number(taskProjectId),
        assignedTo:
          Number(taskAssignedTo),
      });

      setMessage(
        "Task created successfully."
      );

      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("MEDIUM");
      setTaskProjectId("");
      setTaskAssignedTo("");
      setProjectMembers([]);

      await loadData();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  // ============================================
  // UPDATE TASK STATUS
  // ============================================

  const handleStatusChange = async (
    taskId: number,
    status: string
  ) => {
    try {
      setError("");
      setMessage("");

      await updateTaskStatus(
        token,
        taskId,
        status
      );

      setMessage(
        "Task status updated successfully."
      );

      await loadData();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="dashboard">

      {/* HEADER */}

      <header className="dashboard-header">
        <div>
          <h1>
            Client Project Dashboard
          </h1>

          <p>
            {user.name} — {user.role}
          </p>
        </div>

        <button onClick={onLogout}>
          Logout
        </button>
      </header>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      {message && (
        <p className="success-message">
          {message}
        </p>
      )}

      {/* SUMMARY */}

      <section className="summary-grid">

        <div className="summary-card">
          <h3>Projects</h3>
          <strong>
            {projects.length}
          </strong>
        </div>

        <div className="summary-card">
          <h3>Tasks</h3>
          <strong>
            {tasks.length}
          </strong>
        </div>

        <div className="summary-card">
          <h3>Activities</h3>
          <strong>
            {activities.length}
          </strong>
        </div>

      </section>

      {(user.role === "ADMIN" ||
        user.role === "PROJECT_MANAGER") && (
        <>

          {/* CREATE PROJECT */}

          <section className="dashboard-section">
            <h2>
              Create Project
            </h2>

            <form
              className="action-form"
              onSubmit={
                handleCreateProject
              }
            >
              <input
                type="text"
                placeholder="Project name"
                value={projectName}
                onChange={(event) =>
                  setProjectName(
                    event.target.value
                  )
                }
                required
              />

              <textarea
                placeholder="Project description"
                value={
                  projectDescription
                }
                onChange={(event) =>
                  setProjectDescription(
                    event.target.value
                  )
                }
              />

              <button type="submit">
                Create Project
              </button>
            </form>
          </section>

          {/* ADD DEVELOPER */}

          <section className="dashboard-section">
            <h2>
              Add Developer to Project
            </h2>

            <form
              className="action-form"
              onSubmit={
                handleAddMember
              }
            >
              <select
                value={
                  memberProjectId
                }
                onChange={(event) =>
                  setMemberProjectId(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select Project
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={
                        project.id
                      }
                      value={
                        project.id
                      }
                    >
                      {
                        project.name
                      }
                    </option>
                  )
                )}
              </select>

              <select
                value={
                  memberUserId
                }
                onChange={(event) =>
                  setMemberUserId(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select Developer
                </option>

                {users
                  .filter(
                    (
                      currentUser
                    ) =>
                      currentUser.role ===
                      "DEVELOPER"
                  )
                  .map(
                    (
                      currentUser
                    ) => (
                      <option
                        key={
                          currentUser.id
                        }
                        value={
                          currentUser.id
                        }
                      >
                        {
                          currentUser.name
                        }{" "}
                        (
                        {
                          currentUser.email
                        }
                        )
                      </option>
                    )
                  )}
              </select>

              <button type="submit">
                Add Member
              </button>
            </form>
          </section>

          {/* CREATE TASK */}

          <section className="dashboard-section">
            <h2>
              Create Task
            </h2>

            <form
              className="action-form"
              onSubmit={
                handleCreateTask
              }
            >

              <input
                type="text"
                placeholder="Task title"
                value={taskTitle}
                onChange={(event) =>
                  setTaskTitle(
                    event.target.value
                  )
                }
                required
              />

              <textarea
                placeholder="Task description"
                value={
                  taskDescription
                }
                onChange={(event) =>
                  setTaskDescription(
                    event.target.value
                  )
                }
              />

              <select
                value={taskPriority}
                onChange={(event) =>
                  setTaskPriority(
                    event.target.value
                  )
                }
              >
                <option value="LOW">
                  Low
                </option>

                <option value="MEDIUM">
                  Medium
                </option>

                <option value="HIGH">
                  High
                </option>
              </select>

              {/* SELECT PROJECT FIRST */}

              <select
                value={
                  taskProjectId
                }
                onChange={(event) =>
                  setTaskProjectId(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select Project
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={
                        project.id
                      }
                      value={
                        project.id
                      }
                    >
                      {
                        project.name
                      }
                    </option>
                  )
                )}
              </select>

              {/* ONLY PROJECT MEMBERS */}

              <select
                value={
                  taskAssignedTo
                }
                onChange={(event) =>
                  setTaskAssignedTo(
                    event.target.value
                  )
                }
                disabled={
                  !taskProjectId
                }
                required
              >
                <option value="">
                  {!taskProjectId
                    ? "Select Project First"
                    : projectMembers.length === 0
                    ? "No Developers in Project"
                    : "Assign Developer"}
                </option>

                {projectMembers
                  .filter(
                    (member) =>
                      member.role ===
                      "DEVELOPER"
                  )
                  .map(
                    (member) => (
                      <option
                        key={
                          member.id
                        }
                        value={
                          member.id
                        }
                      >
                        {
                          member.name
                        }{" "}
                        (
                        {
                          member.email
                        }
                        )
                      </option>
                    )
                  )}
              </select>

              <button type="submit">
                Create Task
              </button>

            </form>
          </section>

        </>
      )}

      {/* PROJECTS */}

      <section className="dashboard-section">
        <h2>Projects</h2>

        {projects.length === 0 ? (
          <p>
            No projects available.
          </p>
        ) : (
          projects.map(
            (project) => (
              <div
                className="item-card"
                key={project.id}
              >
                <h3>
                  {project.name}
                </h3>

                <p>
                  {
                    project.description
                  }
                </p>
              </div>
            )
          )
        )}
      </section>

      {/* TASKS */}

      <section className="dashboard-section">
        <h2>Tasks</h2>

        {tasks.length === 0 ? (
          <p>
            No tasks available.
          </p>
        ) : (
          tasks.map((task) => (
            <div
              className="item-card"
              key={task.id}
            >

              <h3>
                {task.title}
              </h3>

              <p>
                {task.description}
              </p>

              <p>
                Status:{" "}
                <strong>
                  {task.status}
                </strong>
              </p>

              <p>
                Priority:{" "}
                {task.priority}
              </p>

              {task.project_name && (
                <p>
                  Project:{" "}
                  {
                    task.project_name
                  }
                </p>
              )}

              {task.assigned_user_name && (
                <p>
                  Assigned to:{" "}
                  {
                    task.assigned_user_name
                  }
                </p>
              )}

              {user.role ===
                "DEVELOPER" && (
                <div className="status-control">

                  <label>
                    Update Status
                  </label>

                  <select
                    value={
                      task.status
                    }
                    onChange={(
                      event
                    ) =>
                      handleStatusChange(
                        task.id,
                        event.target.value
                      )
                    }
                  >
                    <option value="TODO">
                      To Do
                    </option>

                    <option value="IN_PROGRESS">
                      In Progress
                    </option>

                    <option value="COMPLETED">
                      Completed
                    </option>
                  </select>

                </div>
              )}

            </div>
          ))
        )}
      </section>

      {/* ACTIVITY FEED */}

      <section className="dashboard-section">
        <h2>
          Activity Feed
        </h2>

        {activities.length === 0 ? (
          <p>
            No activity yet.
          </p>
        ) : (
          activities.map(
            (activity) => (
              <div
                className="item-card"
                key={
                  activity.id
                }
              >
                <strong>
                  {
                    activity.action
                  }
                </strong>

                <p>
                  {
                    activity.details
                  }
                </p>
              </div>
            )
          )
        )}

      </section>

    </div>
  );
}

export default Dashboard;