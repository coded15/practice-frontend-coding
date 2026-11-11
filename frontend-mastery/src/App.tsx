import { useState } from "react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

export default function App() {
  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
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
      <ul>
        {tasks.map((task) => (
          <li>{task.title}</li>
        ))}
      </ul>
    </main>
  );
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
