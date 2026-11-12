# Frontend Mastery: Interview Revision

React + TypeScript practice for building a working UI and explaining the fundamentals.
Main implementation: [src/App.tsx](./src/App.tsx).

## Run the project

From this directory:

```sh
nvm install
nvm use
npm install
npm run dev
```

For later sessions, `nvm use` and `npm run dev` are sufficient if dependencies are installed.

```sh
npm run build
npm run lint
```

- Vite scaffolds the project, serves it during development, and builds it for production.
- React provides the UI library. TypeScript adds static type checking.
- Use Node.js 22 (22.12 or newer), selected by `.nvmrc`.
- TypeScript is kept on 6.0 because the installed `typescript-eslint` tooling does not support TypeScript 7.
- Modern React templates use an automatic JSX transform: no default `React` import is needed just for JSX. Import hooks you actually use.

## Practice status

### Present in the implementation

- Controlled task input and Clear button.
- Add tasks with trimmed titles, rejecting whitespace-only input.
- Submit using Add or Enter through a form.
- Render tasks using stable ID keys.
- Delete tasks by ID.
- Toggle completion without mutating state.
- All / Active / Completed filtering.
- Client-side pagination with Previous / Next and an empty message.
- Automatic user fetching with loading/error UI, abort cleanup, and guards against updates from cancelled requests.
- Case-insensitive local user search and a no-matches message.

These are implementation milestones, not a claim that every behavior has been browser-tested.
The corrected automatic-fetch implementation passes build and lint.

### Explained

- Request cleanup and development Strict Mode.

### Still to practice

- Search and pagination on fetched data; server-side pagination.
- Empty API results, retry behavior, stale requests, and API response validation.
- Closures, debounce, and throttle.
- Event-loop output tracing: synchronous code, promise microtasks, timer tasks.
- Callback-to-promise-to-`async/await` conversion.
- Interview implementations of `map`, `filter`, and `reduce`.
- `this`, `call`, `apply`, and `bind`.
- `Promise.all` and `Promise.any`, including order, rejection, and empty input.
- CSS layout, responsive UI, accessibility, and a timed mock.

Prioritize delivering a working API-backed UI and a timed mock over memorizing every polyfill.
Interview implementations are not automatically specification-compliant polyfills.

## 1. Vocabulary

| Code | Term | Meaning |
|---|---|---|
| `App` | Function component | Function React calls to calculate UI |
| `<h1>`, `<input>` | JSX elements | Describe browser elements |
| `<App />` | Component element | Refers to your component; capitalized |
| `value`, `onChange` | Props | Inputs supplied to an element or component |
| `useState` | Hook | Adds state to a function component |
| `title` | State variable | Current state value for this render |
| `setTitle` | State setter | Requests the next state |
| `(event) => { ... }` | Event-handler function | Runs when React invokes it for the event |
| `{title}` in JSX | JavaScript expression | Inserts a value into the UI |

JSX is JavaScript syntax for describing UI, not an HTML string.
Hooks must be called at the top level of a component or custom hook, not inside conditions, loops, or event handlers.

## 2. State and rendering

**Definition:** `useState` is a React Hook that adds a state variable to a function component.
It returns the current state and a setter that requests an update.

```tsx
const [title, setTitle] = useState("");
```

- The square brackets use array destructuring to name the two returned values.
- The initial value is used on mount, not to reset state on every render.
- React stores state associated with the component's identity and position in the UI tree.
- A render calls the component to calculate UI; React then commits necessary DOM updates.
- Updating `tasks` does not automatically change `title`, `filter`, or `page`.
- Ordinary local calculations run again; state retains its remembered values.
- React can skip rendering for an identical state value.
- Removing/remounting a component or changing its identity/key can reset state. A page refresh also loses this in-memory state.

```tsx
setTitle("Hello");
console.log(title); // Still the value from the currently running render.
```

State is a snapshot for each render. A setter does not rewrite variables in the already running handler.

### Why state, rather than a local variable?

Assigning to a local variable does not tell React to render, and local variables are recreated when the component runs again.
Use state for information that must persist between renders and affect UI.

### Controlled input

```tsx
<input
  value={title}
  onChange={(event) => {
    setTitle(event.currentTarget.value);
  }}
/>
```

Flow: user types -> handler reads text -> setter updates state -> render -> input displays state.
`setTitle("")` clears the input because its `value` is tied to `title`.
A previously created task retains its copied string; clearing the input does not clear that task.
For a checkbox, use `checked={task.completed}`.

### State versus derived values

- State: `tasks`, `filter`, `page`, `users`, `loading`, `error`.
- Derived: filtered tasks, page count, safe display page, sliced tasks.

Do not duplicate a value in state when it can be calculated from existing state during rendering.

## 3. Functions and arrow syntax

**Practice convention: use braces and explicit returns for arrow functions.**

```tsx
(parameters) => {
  // Statements
}
```

Return a value when the caller needs one:

```tsx
const titles = tasks.map((task) => {
  return task.title;
});
```

An action handler generally does not need a return:

```tsx
onClick={() => {
  handleDelete(task.id);
}}
```

### Passing versus calling

```tsx
onClick={addTask}   // Pass a function for React to call on click.
onClick={addTask()} // Wrong here: execute it during rendering.
```

Use the same wrapper pattern for consistency:

```tsx
onClick={() => {
  addTask();
}}
```

```tsx
onClick={() => {
  handleDelete(task.id);
}}
```

Creating a function does not execute its body. The wrapper delays the inner call until the click.
Defining a handler that reads or updates state does not subscribe it to state changes.
Updating state rerenders the component; it does not automatically run its event handlers.

### Brackets and returns

| Syntax | Meaning |
|---|---|
| `(task) =>` | Function parameters |
| `handleDelete(task.id)` | Function invocation with an argument |
| `=> { ... }` | Function body; needs explicit `return` to produce a value |
| `return ( ... )` | Group a returned expression, often multiline JSX |
| `{task.title}` inside JSX | Evaluate JavaScript |
| `{ ...task, completed: true }` | Object literal with copied and overridden properties |

Keep `return (` on the same line. A newline immediately after `return` can cause JavaScript to return `undefined`.

These are equivalent, but prefer the second while practicing:

```tsx
(task) => task.title

(task) => {
  return task.title;
}
```

Do not mix function declaration and arrow syntax:

```tsx
function handleDelete(id: string) {
  // ...
}

const anotherHandler = (id: string) => {
  // ...
};
```

Function declarations can be used before their textual declaration.
A `const` arrow function must be initialized before it is used; do not put its initialization after the component's `return`.

## 4. Functional state updates and immutable arrays

```tsx
setTasks((previousTasks) => {
  return previousTasks.filter((task) => {
    return task.id !== idToDelete;
  });
});
```

- `previousTasks` is a function parameter, not another state variable.
- You choose the parameter's name. React calls the updater with the latest pending state.
- `setTasks` knows the state it belongs to because React created the `tasks` / `setTasks` pair.
- The updater must return the next state and should remain pure.
- Prefer this form when the next value depends on the previous value.

Why not always read `tasks` directly? That variable is a snapshot from the render that created the handler.
Queued updates compose correctly when each updater uses the latest pending value.

```tsx
// Starting at 0: both request 1, so the result is 1.
setCount(count + 1);
setCount(count + 1);

// Starting at 0: queued transformations produce 2.
setCount((previous) => {
  return previous + 1;
});
setCount((previous) => {
  return previous + 1;
});
```

### Add: spread

```tsx
setTasks((previousTasks) => {
  return [...previousTasks, newTask];
});
```

### Delete: filter

```tsx
setTasks((previousTasks) => {
  return previousTasks.filter((task) => {
    return task.id !== idToDelete;
  });
});
```

`filter` keeps an item when its callback returns a truthy value.
Delete by stable ID, not title: duplicate titles are allowed.

### Update: map

```tsx
function toggleTask(id: string) {
  setTasks((previousTasks) => {
    return previousTasks.map((task) => {
      if (task.id === id) {
        return {
          ...task,
          completed: !task.completed,
        };
      }

      return task;
    });
  });
}
```

`map` returns one result per item. Return a copied object for the matching task and retain the other objects.
`!` flips a boolean. Keep IDs stable; toggle `completed`, not `id`.
`=` assigns; `===` compares.

## 5. TypeScript essentials

```tsx
type Task = {
  id: string;
  title: string;
  completed: boolean;
};

const [tasks, setTasks] = useState<Task[]>([]);
```

- `Task` describes one object's shape.
- `Task[]` means an array of those objects.
- `<Task[]>` is a generic type argument telling `useState` what it stores.
- It is useful because an empty array gives no example item to infer from; strict configurations commonly infer `never[]` here.
- `useState("")` can infer `string` from the initial value.
- Types go after the name: `const newTask: Task = ...`, not `Task newTask = ...`.

```tsx
type Filter = "all" | "active" | "completed";
```

This is a type alias for a union of string literal types, not an interface.
Both a type alias and an interface can describe an object shape; an interface cannot directly represent this string union.
Check an input string against the allowed values before supplying it to `setFilter`.

Types do not validate external JSON at runtime.
The practice users API returns numeric IDs, unlike the task UUID strings.

## 6. Events, forms, and accessibility

### target versus currentTarget

- `event.target`: element where the event originated.
- `event.currentTarget`: element whose handler is executing.
- An event can bubble from a nested child to an ancestor.
- Clicking a span inside a button can produce `target = span`, `currentTarget = button`.
- For the select change handler, `currentTarget` explicitly identifies the select and has the appropriate TypeScript element type.
- The callback parameter is an event regardless of what you name it. Naming it `task` does not make React pass a task.

### Form submission

```tsx
<form
  onSubmit={(event) => {
    event.preventDefault();
    addTask();
  }}
>
  {/* Input and other controls */}
  <button type="submit">Add</button>
  <button type="button">Clear</button>
</form>
```

- A normal button associated with a form defaults to submit behavior if `type` is omitted.
- `type="button"` performs an action without submitting; use it for Clear, Delete, and pagination.
- `type="submit"` intentionally submits. Suitable form inputs also support Enter submission.
- `preventDefault()` prevents default browser submission/navigation.
- Do not also attach `onClick={addTask}` to Add when the form's `onSubmit` already calls it: that can add twice.
- A checkbox is `<input type="checkbox">`, not `<button type="check-box">`.
- Button text goes between tags. `name="clear"` does not create its visible label.
- Labels associate descriptive text with inputs using `htmlFor` / `id`, or by wrapping the input.

### section versus form

- `section`: a thematic grouping, usually with a heading; no submission behavior.
- `form`: controls grouped for submission.
- They can be nested appropriately. Choose semantic HTML for meaning and behavior, not styling.

### role="alert"

Marks an important dynamic message for assistive technologies; screen readers generally announce updates.
It does not add styling, move focus, or create a popup. Reserve it for important messages such as errors.

### List keys

```tsx
{tasks.map((task) => {
  return <li key={task.id}>{task.title}</li>;
})}
```

Use a stable ID on the outermost returned item. Avoid array indices for lists that can be inserted, deleted, or reordered.
With a brace-bodied map callback, forgetting `return` produces no elements and can cause a `void[]` type error.

## 7. Filtering and client-side pagination

Pipeline: **all tasks -> filter -> paginate -> render**.

```tsx
const pageSize = 3;
const totalPages = Math.max(1, Math.ceil(visibleTasks.length / pageSize));
const currentPage = Math.min(page, totalPages);
const startIndex = (currentPage - 1) * pageSize;
const paginatedTasks = visibleTasks.slice(startIndex, startIndex + pageSize);
```

- `Math.ceil`: round up because a partial final page still needs a page.
- `Math.max(1, ...)`: keep the minimum page count at 1 for this UI's empty-list convention.
- `Math.min(page, totalPages)`: prevent an out-of-range display page after deleting or filtering.
- Deleting changes tasks, not stored page state. Re-rendering recalculates the safe display page.
- The clamp does not update `page`: the stored request can remain larger than the displayed page. If items are later added, the display can advance toward that stored page again. A stricter UX would also normalize the stored page.
- `slice(start, end)` excludes `end` and does not mutate the source array.
- Seven tasks at three per page produce page sizes 3, 3, 1.
- Disable Previous only on page 1; disable Next only on the last page.
- Reset page to 1 when the selected filter changes.
- Filtering hides items; it does not remove them from task state.
- Render the empty message when no tasks match.

Server-side pagination is different: request the desired page from the API rather than fetching everything and slicing locally.

## 8. Fetching, promises, loading, and errors

Practice endpoint: `https://jsonplaceholder.typicode.com/users`.
It is a public sample API. Real endpoint URLs and response shapes come from API documentation, backend contracts, or existing clients, not guesses.

```tsx
const response = await fetch(url);

if (!response.ok) {
  throw new Error(`Request failed: ${response.status}`);
}

const data: User[] = await response.json();
setUsers(data);
```

- `fetch` resolves to the standard Fetch API `Response` object.
- `ok` and `status` belong to `Response`, not the API's JSON body.
- `ok` is true for status codes 200 through 299.
- `fetch` does not reject merely because the HTTP status is 404 or 500; check `ok`.
- The first await gets the response once available; the body may still be arriving.
- `response.json()` returns another promise that reads the body and parses JSON. Await that too.
- An annotation like `User[]` is not runtime response validation.

### When to await

Check return types using VS Code hover or documentation.
Await a promise when subsequent steps need its result or completion.

| Expression | Result | Await for the value? |
|---|---|---|
| `fetch(url)` | `Promise<Response>` | Yes |
| `response.json()` | Promise of parsed JSON | Yes |
| `response.ok` | Boolean | No |
| `title.trim()` | String | No |
| `tasks.filter(...)` | Array | No |
| `setTasks(...)` | `void` | No; it does not wait for rendering |
| `setTimeout(...)` | Timer identifier | No; awaiting it does not wait for the timer |

`async` makes a function return a promise and allows `await`; it does not require an await.
Await pauses that async function, not the entire browser.
You can return a promise to a caller or combine independent operations with `Promise.all` instead of awaiting every call separately.
Handle rejections; do not leave promises unattended.

### Request UI lifecycle

1. Set loading to true and clear the previous error.
2. Fetch and check HTTP success.
3. Parse JSON and store users.
4. Catch errors and display a message.
5. In `finally`, reset loading after success or failure.

Loading and error are state because changing them should update the UI.
In the earlier button-triggered version, disabling the request button while loading prevented repeated clicks from starting overlapping requests.
The current version fetches automatically on mount and has no active Load Users button or retry action.

### Why check instanceof Error?

JavaScript can throw any value, including strings.
`error instanceof Error` narrows the caught value to an Error object before accessing `.message`.
Use an explicit fallback message for other thrown values.

## 9. useEffect: implemented

**Definition:** a Hook for synchronizing a component with an external system, such as a network request, timer, or subscription.
Setup runs after the UI commit, not during rendering.

| Dependency argument | When setup runs |
|---|---|
| Omitted | After every commit |
| `[]` | On mount, with cleanup on unmount |
| `[page]` | On mount and when `page` changes |

Include all reactive values read by the effect; do not omit dependencies just to suppress reruns.
A cleanup runs before setup reruns with changed dependencies and when the component unmounts.
Development Strict Mode may perform an extra setup -> cleanup -> setup cycle to test cleanup.

Implemented pattern:

- Import `useEffect`.
- Move fetching into a function defined inside the effect.
- Invoke that function in the effect.
- Remove the old click-only loader/button, or deliberately design a separate retry action.
- Create an `AbortController` and pass its signal to fetch.
- Return cleanup that calls `controller.abort()`.
- Ignore intentional cancellation, and prevent an obsolete request from updating users, error, or loading.

Do not make the effect callback itself `async`: React expects it to return a cleanup function or nothing, not a promise.

### What is the controller?

`controller` is our variable name for an `AbortController` instance, a standard JavaScript cancellation API, not a React feature.

```tsx
const controller = new AbortController();
const response = await fetch(url, { signal: controller.signal });
```

- `controller.signal` is the cancellation signal passed to the operation.
- `controller.abort()` requests cancellation of operations using that signal.
- `controller.signal.aborted` tells us whether cancellation has been requested.
- Creating a controller without passing its signal to fetch does not connect it to the request.
- Aborting an in-flight fetch normally rejects its promise with an `AbortError`; our catch treats intentional cancellation differently from real failures.
- Aborting cannot undo completed work or guarantee that the server stops processing a request.
- A signal stays aborted; create a new controller for each effect setup.
- Effect cleanup cancels the obsolete request, while guards prevent obsolete results from updating state.

### Mistakes caught and corrected in the first effect attempt

- An effect after the component's `return` is unreachable. Put all hooks before the component returns JSX. A function declaration can be referenced before its textual declaration, but a `useEffect(...)` call after `return` never executes.
- A function declared inside the effect is scoped to the effect. JSX outside it cannot reference `loadUsers`; remove the old Load Users button for automatic loading.
- Creating and aborting an `AbortController` is not enough: connect it with `fetch(url, { signal: controller.signal })`.
- Guard user/error/loading updates against cancellation. An intentionally aborted request is not a user-facing error, and its `finally` must not clear a newer request's loading indicator.

### Client-side user search: implemented

Keep the query in state and derive the matching users during rendering.
Normalize the query and names with `toLowerCase()` for case-insensitive comparison; use `includes()` to match substrings.
An empty query should show all users. Search locally over fetched data rather than refetching on every keystroke.
When combining search with pagination, search first, paginate second, and reset the relevant page on query changes.
Client-side filtering does not need an effect or debounce just to work.

The first search implementation returned `user.name` on a match and `undefined` otherwise.
This passes build/lint and works for nonempty names because filter tests truthiness, but returning the boolean from `includes()` directly is clearer and also handles empty names correctly.
`filter` keeps the original object; it does not replace the object with the returned name.

## Closures: introduction for debounce and throttle

A closure lets a function access bindings from the lexical scope in which it was created, even after the outer function returns.

```js
function createCounter() {
  let count = 0;

  return function increment() {
    count = count + 1;
    return count;
  };
}

const counter = createCounter();
counter(); // 1
counter(); // 2
```

Calling `counter` does not rerun `createCounter`, so it does not reset count.
The returned function retains access to the same count binding.
Calling `createCounter()` again creates an independent counter with a separate binding.
This is ordinary JavaScript, not React state; changing this count does not itself trigger React rendering.
Debounce uses this mechanism to retain a timer identifier between calls. Implementation practice is still pending.

## 10. Interview checklist and manual checks

Approach: clarify requirements -> sketch the data -> build the smallest working flow -> handle edge cases -> polish.
Explain what you will implement before coding.

- Add a task through both the button and Enter; each action should add exactly once.
- Reject empty and whitespace-only titles.
- Add duplicate titles; deleting one should not delete the other.
- Toggle a task twice; other tasks should not change.
- Switch All / Active / Completed and check the results.
- Add seven tasks and verify pagination sizes 3, 3, 1.
- Verify Previous / Next boundary disabling.
- Delete the only task on the last page.
- Change a filter from a later page; confirm it resets to page 1.
- Fetch users; verify loading, success, and error presentation.
- Test API empty results and effect cleanup when those features are implemented.
- Run build and lint; inspect the browser console.

### Quick recall

- State updates trigger rendering, not event handlers.
- A function definition is not a function call.
- React supplies events to handlers and pending state to state updaters.
- State persists between renders; derived local values are recalculated.
- Controlled input: state is the source of truth.
- Add: spread. Delete: filter. Update: map.
- `map` returns an item; `filter` returns whether to keep it; state updaters return next state.
- Await promises whose results or completion you need.
- TypeScript checks types during development, not untrusted data at runtime.
