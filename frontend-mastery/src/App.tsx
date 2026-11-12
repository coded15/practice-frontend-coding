import { useState } from "react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

type Filter = "all" | "completed" | "active";

export default function App() {
  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const visibleTasks = tasks.filter((task) => {
    if (filter === "completed") {
      return task.completed;
    }
    if (filter === "active") {
      return !task.completed;
    }
    return true;
  });
  return (
    <main>
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
      <button onClick={addTask}>Add</button>
      <label htmlFor="task-filter">Show</label>
      <select id = "task-filter" value={filter} onChange={(event) => {const value = event.currentTarget.value
        if(value === "all" || value == "completed" || value == "active")
        {
          setFilter(value)
        }
      }}>
        <option value="all">All</option>
        <option value="completed">Completed</option>
        <option value="active">Active</option>
      </select>
      <ul>
        {visibleTasks.map((task) => (
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

// import { useState } from "react";

// type Task = {
//   id: string;
//   input: string;
//   completed: boolean;
// }

// export default function App() => {
//   [tasks, setTask] = useState<Task[]>([]);
//   [title, setTitle] = useState("");
//   return(
//     <main>
//     <p>input task</p>
//     <input id= "input-bar" value= {title} onChange={(event)=>setTitle(event.target.value)}/>
//     <button onClick={addTask}>Add task</button>
//     <ul>
//     tasks.map((task) => (<li>task.input</li>))
//     </ul>
//     </main>

//   )
//   function addTask(): Task[] => {
//     const trimmedTitle = title.trim();
//     if(trimmedTitle === "")
//     const newTask : Task = {
//       id: crypto.randomUUID(),
//       input: trimmedTitle,
//       completed: false,
//     }
//     return(
//       setTask((prevTasks) => [...prevTasks, newTask]);
//       setTitle("");
//     )
//   }
// }
