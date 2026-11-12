import { useState, useEffect } from "react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

type User = {
  name: string;
  id: number;
  email: string;
};

type Filter = "all" | "completed" | "active";

export default function App() {
  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const pageSize = 3;
  const visibleTasks = tasks.filter((task) => {
    if (filter === "completed") {
      return task.completed;
    }
    if (filter === "active") {
      return !task.completed;
    }
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(visibleTasks.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  const paginatedTasks = visibleTasks.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    const controller = new AbortController();
    async function loadUsers() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          "https://jsonplaceholder.typicode.com/users",
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        const data: User[] = await response.json();
        if (!controller.signal.aborted) {
          setUsers(data);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Unable to load users.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    loadUsers();
    return () => {
      controller.abort();
    };
  }, []);
  const matchingUsers = users.filter((user) => {
    return user.name.toLowerCase().includes(search.trim().toLowerCase());
  });
  return (
    <main>
      <section>
        <h2>Users</h2>
        {/* <button type="button" disabled={loading} onClick={loadUsers}> */}
        {/* Load Users
        </button> */}
        <label htmlFor="user-search">Search Users</label>
        <input
          id="user-search"
          value={search}
          type="search"
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        {loading && <p>Loading Users</p>}
        {error && <p role="alert">{error}</p>}
        {matchingUsers.length === 0 && !loading && !error && (
          <p>No matching users found</p>
        )}
        <ul>
          {matchingUsers.map((user) => (
            <li key={user.id}>
              {user.name} - {user.email}
            </li>
          ))}
        </ul>
      </section>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          addTask();
        }}
      >
        <h1>Task List</h1>
        <label htmlFor="task-title">Task Name</label>
        <input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <p>You typed: {title}</p>
        <button type="button" onClick={() => setTitle("")}>
          Clear
        </button>
        <button type="submit">Add</button>
      </form>

      <label htmlFor="task-filter">Show</label>
      <select
        id="task-filter"
        value={filter}
        onChange={(event) => {
          const value = event.currentTarget.value;
          if (value === "all" || value == "completed" || value == "active") {
            setFilter(value);
            setPage(1);
          }
        }}
      >
        <option value="all">All</option>
        <option value="completed">Completed</option>
        <option value="active">Active</option>
      </select>
      <ul>
        {paginatedTasks.map((task) => (
          <li key={task.id}>
            {/* {task.title} */}
            <label>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
              />
              {task.title}
            </label>
            <button type="button" onClick={() => handleDelete(task.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => setPage(currentPage + 1)}
      >
        Next
      </button>
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => setPage(currentPage - 1)}
      >
        Previous
      </button>
      {visibleTasks.length === 0 && <p>No matching tasks.</p>}
    </main>
  );
  function toggleTask(id: string) {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function handleDelete(idToDelete: string) {
    setTasks(tasks.filter((task) => task.id !== idToDelete));
  }
  function addTask() {
    const trimmedTitle = title.trim();
    if (trimmedTitle === "") {
      return;
    }
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      completed: false,
    };
    // Task previousTask = task;
    // Task newTask = ;
    setTasks((tasks) => [...tasks, newTask]);
    setTitle("");
  }
}
