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
Debounce uses this mechanism to retain a timer identifier between calls.

### Trailing debounce: explained; reproduction practice pending

Debounce calls the callback only after calls have stopped for the specified delay.

```js
function debounce(callback, delay) {
  let timerId;

  return function (...args) {
    clearTimeout(timerId);

    timerId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}
```

- The closure preserves one timer ID for this wrapper.
- `...args` in the parameter list collects arguments into an array (rest).
- `callback(...args)` expands them into separate arguments (spread).
- Each call cancels the previous pending timer and schedules a new one using the latest arguments.
- The timer callback's braces need no return because it performs an action.
- Calls at 0, 100, and 200 ms with a 300 ms delay produce only the last callback, approximately at 500 ms or later.
- Create the debounced wrapper once and reuse it. Recreating it for each event creates separate timers that cannot cancel each other.
- This is a basic trailing-only version: no leading call, `cancel`/`flush` API, return-value forwarding, or preservation of a caller's dynamic `this`.
- A React render recreates ordinary local variables. Do not construct this wrapper inline per input event; React integration needs a stable wrapper with timer cleanup, or a debounce effect.
- An alternative in React is an effect that schedules `setTimeout` on query changes and returns `clearTimeout` cleanup.

#### Who supplies callback and args?

```js
function searchUsers(query) {
  console.log("Searching:", query);
}

const debouncedSearch = debounce(searchUsers, 300);
debouncedSearch("react");
```

- The caller of `debounce` supplies `searchUsers` as `callback` and `300` as `delay`.
- A callback is simply a function passed to other code for that code to invoke.
- `debounce` returns a new wrapper function, stored in `debouncedSearch`.
- The caller of that wrapper supplies `"react"`, collected as `args = ["react"]`.
- The timer eventually calls `callback(...args)`, equivalent here to `searchUsers("react")`.
- `clearTimeout(timerId)` cancels a scheduled timer; it does not delete the variable, reset its value, or destroy the closure.
- The closure preserves access to bindings, not immutable copies of their values. Reassigning `timerId` replaces the stored timer identifier while retaining the same shared binding.

### Leading throttle: explained; reproduction practice pending

Throttle limits execution frequency during continuous calls. This version runs the first call immediately, ignores calls during the cooldown, and becomes ready after the timer fires.

```js
function throttle(callback, delay) {
  let ready = true;

  return function (...args) {
    if (!ready) {
      return;
    }

    ready = false;

    setTimeout(() => {
      ready = true;
    }, delay);

    callback(...args);
  };
}
```

- The closure preserves the shared `ready` binding between calls.
- An early `return` skips calls during the cooldown.
- Set up the reset timer before invoking the callback so a synchronous callback error does not leave the wrapper permanently locked.
- The timer only unlocks the wrapper; it does not invoke a skipped call.
- This is leading-only: no trailing invocation, dynamic `this` preservation, or cancellation API.
- With a 300 ms delay, synchronous calls with `"a"`, `"ab"`, and `"abc"` invoke only `"a"`.
- Debounce waits for quiet and uses the latest arguments; leading throttle runs immediately and drops calls during the cooldown.
- For continuous scroll/resize updates, throttle can keep processing periodically; debounce waits until calls pause.
- These utility exercises are vanilla JavaScript. Pasting untyped parameters into the TypeScript component may cause lint/type errors; keep console practice separate until adding proper types and integration.

### Where to call debounce and throttle during practice

The current utility declarations are inside `App`, so they are not accessible by name from the browser console.
For isolated vanilla-JavaScript practice, copy each complete function declaration into DevTools Console first, then run:

```js
const debouncedLog = debounce(console.log, 1000);
debouncedLog("r");
debouncedLog("re");
debouncedLog("react");
// Only "react", after roughly one second.

const throttledLog = throttle(console.log, 1000);
throttledLog("first");
throttledLog("second");
setTimeout(() => {
  throttledLog("later");
}, 1500);
// "first" immediately, "second" skipped, "later" after the cooldown.
```

Calling the factory (`debounce` or `throttle`) creates a wrapper; calling that wrapper schedules or executes the action.
Do not invoke these demo calls in the component body: rendering should not schedule timers or perform logging demos.
React event integration is a separate step: preserve the wrapper across renders and clean up timers.

## Event loop: execution order

For these browser examples:

1. Run synchronous code on the current stack.
2. Once the stack is empty, drain the microtask queue, including microtasks added while draining it.
3. Process a ready task, such as a timer callback, then drain microtasks again.

Promise `.then` callbacks and continuations after `await` run as microtasks.
Timer callbacks run as tasks (often called macrotasks).
A zero-millisecond timer does not interrupt the current synchronous code.
Promise executor functions run synchronously; do not confuse the executor with `.then` callbacks.
This is the useful interview model for these examples, not a complete account of browser rendering or scheduling among all task sources.

```js
console.log("A");
setTimeout(() => {
  console.log("B");
}, 0);
Promise.resolve().then(() => {
  console.log("C");
});
console.log("D");
```

Order: `A`, `D`, `C`, `B`.

### async/await ordering

```js
console.log("A");
async function run() {
  console.log("B");
  await Promise.resolve();
  console.log("C");
}
run();
console.log("D");
```

Order: `A`, `B`, `D`, `C`.
An async function starts synchronously. At await, that function suspends; the caller continues.
Even an already fulfilled promise resumes the awaiting function later through a microtask.
An async function does not move all of its code into a microtask.

### Promise executor versus then callback

```js
console.log("A");
new Promise((resolve) => {
  console.log("B");
  resolve();
}).then(() => {
  console.log("C");
});
console.log("D");
```

The Promise constructor calls its executor synchronously.
Resolving a promise does not make its `.then` callback execute inline; that callback runs as a microtask.

### Practice: nested microtasks

```js
console.log("start");
setTimeout(() => {
  console.log("timer");
}, 0);
Promise.resolve().then(() => {
  console.log("promise 1");
  Promise.resolve().then(() => {
    console.log("promise 2");
  });
});
console.log("end");
```

Predict the order before running it. The nested promise callback joins the microtask queue and runs before the timer.

## Array map: interview implementation

The Promise executor exercise above prints `A`, `B`, `D`, `C`: the executor is synchronous and the `.then` callback is a microtask.

Practice this in the browser console, not in the TypeScript React component.
Use `myMap` rather than replacing native `map`.
The assignment below creates a practice method; it is not a production polyfill.

```js
Array.prototype.myMap = function (callback) {
  if (typeof callback !== "function") {
    throw new TypeError("callback must be a function");
  }

  const length = this.length;
  const result = new Array(length);

  for (let index = 0; index < length; index = index + 1) {
    if (index in this) {
      result[index] = callback(this[index], index, this);
    }
  }

  return result;
};

const doubled = [2, 4, 6].myMap((number) => {
  return number * 2;
});
// [4, 8, 12]
```

- In `numbers.myMap(...)`, a normal function receives `numbers` as `this`.
- Validate with `typeof callback !== "function"`, not `callback !== "function"`. The latter compares the function value to a string and incorrectly rejects valid callbacks.
- Do not use an arrow for the method itself: it would capture lexical `this` rather than the calling array.
- The caller supplies the callback; the loop supplies its item, index, and source-array arguments.
- JavaScript permits extra arguments: a callback declaring only `(number)` receives the first argument in that parameter and can ignore the supplied index and array. Missing arguments become `undefined` unless defaults apply. TypeScript may reject an explicit call with extra arguments based on its declared signature, but a callback using fewer parameters is compatible with map's callback contract.
- Return a new array; do not mutate the source.
- Snapshot length before iterating, matching native map's initial iteration bound.
- Preallocating the result and checking `index in this` preserves sparse-array holes.
- Native map also accepts `thisArg` and supports generic array-like objects with additional specification rules; this exercise does not fully implement those semantics, species construction, or native property descriptors.
- Reproduction and edge-case practice are still pending.

### What is Array.prototype?

`Array` is JavaScript's built-in array constructor. `Array.prototype` is the shared prototype object from which ordinary arrays inherit methods such as `map`, `filter`, and `push`.

When evaluating `numbers.myMap`, JavaScript first checks `numbers` itself.
If the property is not there, it searches the prototype chain and finds the method added to `Array.prototype`.
The method is shared through inheritance, not copied onto every array.

```js
const numbers = [1, 2, 3];
Object.getPrototypeOf(numbers) === Array.prototype; // true
```

In `numbers.myMap(callback)`, ordinary function-call rules set the method's `this` to `numbers`.
The prototype determines where the method is found; the call determines its `this`.
Adding practice methods changes native prototypes for that page context, so use a separate name and do not overwrite built-ins.
Production code generally should not modify native prototypes except through carefully designed, standards-compliant polyfills.

## Array filter: interview implementation

Practice in the browser console without replacing native `filter`.

```js
Array.prototype.myFilter = function (callback) {
  if (typeof callback !== "function") {
    throw new TypeError("callback must be a function");
  }

  const length = this.length;
  const result = [];

  for (let index = 0; index < length; index = index + 1) {
    if (index in this) {
      const value = this[index];

      if (callback(value, index, this)) {
        result.push(value);
      }
    }
  }

  return result;
};
```

- Map stores the callback's returned value at the corresponding index.
- Filter checks the callback's truthiness and appends the original item when it passes.
- Filter's output has no holes from skipped source slots, so start with `[]`, not `new Array(length)`.
- Snapshot both initial length and the current value before invoking the callback. A callback can mutate the source; native filter retains the value read before that callback.
- Like the map exercise, this is a simplified array-method implementation, not a fully specification-compliant polyfill; `thisArg`, generic length conversion, species, and property descriptors are not implemented.

```js
[1, 2, 3, 4].myFilter((number) => {
  return number % 2 === 0;
});
// [2, 4]
```

Practice empty arrays, all-pass, none-pass, and sparse arrays before implementing it without a reference.

### Filter mistake: comparing the item with the predicate result

Do not use `this[index] === callback(this[index], index, this)`.
For an even-number predicate, item `2` yields `true`, but `2 === true` is false.
Filter checks the callback result's truthiness rather than comparing it with the original item.
Use `if (callback(value, index, this))` and then push the original saved value.
Also retain the `index in this` check to skip holes.
`new Array` is valid and produces an empty array, but `[]` is clearer here.
Keep spelling consistent: `myFiler` and `myFilter` are different property names.

### Why throw instead of logging invalid callbacks?

`console.log` or `console.error` reports a message but does not stop execution.
`throw new TypeError(...)` stops the current function unless the error is caught, propagates failure to the caller, and matches native map/filter behavior for a non-callable callback.
Logging alone would continue into an invalid callback call, or return an apparently valid empty result for an empty source array.
Validation must happen even if no array items exist.
The caller can handle a thrown error with `try/catch`; logging is not a substitute for signalling failure.

## Array reduce: interview implementation

Reduce combines items into one accumulated result. The result can be a number, string, object, array, or another value.

```js
[1, 2, 3].reduce((accumulator, item) => {
  return accumulator + item;
}, 0);
// 6
```

With initial value 0: `0 + 1 -> 1`, `1 + 2 -> 3`, `3 + 3 -> 6`.
The callback's return becomes the accumulator for the next iteration.

```js
Array.prototype.myReduce = function (callback, initialValue) {
  if (typeof callback !== "function") {
    throw new TypeError("callback must be a function");
  }

  const length = this.length;
  let index = 0;
  let accumulator;

  if (arguments.length >= 2) {
    accumulator = initialValue;
  } else {
    while (index < length && !(index in this)) {
      index++;
    }

    if (index >= length) {
      throw new TypeError("Reduce of empty array with no initial value");
    }

    accumulator = this[index];
    index++;
  }

  for (; index < length; index++) {
    if (index in this) {
      accumulator = callback(accumulator, this[index], index, this);
    }
  }

  return accumulator;
};
```

- With an initial value, start there and visit the first existing item.
- Without an initial value, use the first existing item as the accumulator and begin callback calls at the next item.
- Use `arguments.length >= 2`, not an undefined or truthiness check: explicitly supplied `undefined`, 0, false, and empty string are all supplied initial values.
- `arguments` here belongs to the normal `myReduce` function and contains the arguments supplied to that method call.
- Skip sparse-array holes, including when searching for the first accumulator.
- Empty or all-hole arrays without an initial value must throw.
- An empty array with an initial value returns that value without invoking the callback.
- Like the other practice methods, this omits full generic receiver/length conversion and other specification details. Do not overwrite native reduce.

Tests to reproduce: `[1, 2, 3]` with and without initial 0, `[]` with initial 0, `[]` without an initial value, and sparse arrays.

### Reduce mistake: summing callback results

`result += callback(this[index], index, this)` implements a sum of callback outputs, not reduce.
Reduce must pass the previous accumulator as the first callback argument and replace it with the returned value:
`result = callback(result, this[index], index, this)`.
Without that first argument, a callback declaring `(total, number)` incorrectly receives the item as total and the index as number.
Do not hardcode the initial accumulator to 0: multiplication may start at 1, concatenation at an empty string, and grouping at an object.
The method must accept the initial value and separately handle when it is omitted.

If reduce calls only `callback(this[index])`, the item fills the first parameter (the accumulator position), while the second parameter is `undefined`.
For `(total, number) => total + number`, calling with item 1 alone evaluates `1 + undefined`, yielding `NaN`.
At minimum, a sum callback needs accumulator and item; a native-compatible callback contract also supplies index and source array.
In map/filter, supplying only the item can work for item-only callbacks but breaks callbacks using index or array.

## Pure functions

A pure function returns the same result for the same inputs and has no observable side effects.
It does not mutate its inputs or external state, change the DOM, make network requests, or perform logging.
It does not depend on changing hidden inputs such as the current time or random numbers.

```js
function add(a, b) {
  return a + b;
}

function completeTask(task) {
  return { ...task, completed: true };
}
```

Creating a new object is fine: pure does not mean returning the same object reference.
Mutating a newly created local array before returning it can also be pure; mutating an input array is not.

### Same output shape, different effect on the original

```js
function mutateTask(task) {
  task.completed = true;
  return task;
}

const originalA = { title: "Practice", completed: false };
const resultA = mutateTask(originalA);
console.log(originalA.completed); // true: original changed
console.log(resultA === originalA); // true: same object

function copyTask(task) {
  return { ...task, completed: true };
}

const originalB = { title: "Practice", completed: false };
const resultB = copyTask(originalB);
console.log(originalB.completed); // false: original unchanged
console.log(resultB.completed); // true: new object updated
console.log(resultB === originalB); // false: different objects
```

Function parameters do not automatically clone objects. In the first call, the parameter and caller's variable refer to the same object.
Object spread creates a new, shallow object: nested objects are still shared unless separately copied.

React render logic, reducers, and state-updater functions should be pure.
Event handlers and effects are appropriate places for side effects.
Development Strict Mode may invoke render logic and updater functions extra times to help reveal impurities.

## Spoken revision: React Hooks and promises

Pause call/apply/bind implementation practice here and resume after revising these definitions.

### React Hooks

Hooks are functions that let function components use React features such as state, context, refs, and effects.
These are the commonly asked hooks, not an exhaustive list.

| Hook | Interview definition |
|---|---|
| `useState` | Adds state to a function component and returns the current value plus a setter. |
| `useEffect` | Synchronizes a component with an external system after a commit; can return cleanup. |
| `useContext` | Reads and subscribes to the nearest matching context provider's value. |
| `useRef` | Returns a stable object whose mutable `.current` persists across renders; changing it does not trigger a render. Also used for DOM references. |
| `useReducer` | Manages state through a reducer and dispatch; React passes the current state and an action to the reducer to calculate next state. |
| `useMemo` | Caches a calculation's result between renders while dependencies remain unchanged, as a performance optimization. |
| `useCallback` | Caches a function reference between renders while dependencies remain unchanged; does not execute the function. |

- Call these hooks at the top level of function components or custom hooks, before conditional returns.
- Do not call them in loops, conditions, event handlers, or ordinary utility functions.
- A custom hook is a function beginning with `use` that composes hooks to reuse logic. Separate calls do not automatically share state.
- State changes request rendering; ref mutations do not.
- `useMemo` caches a result; `useCallback` caches a function. Neither should be required for correctness.
- Effects are not a default place for calculations like filtering; calculate derived data during rendering.

### Detailed hook definitions and examples

These are separate examples, not code to paste together into one file. React/TypeScript imports are shown where needed.

#### useState

**Formal definition:** `useState` declares a state variable in a function component and returns a pair containing its current value and a setter function that requests the next state.

```tsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button
      type="button"
      onClick={() => {
        setCount((previous) => {
          return previous + 1;
        });
      }}
    >
      Count: {count}
    </button>
  );
}
```

The initial value is used on mount. State persists across renders for the same component identity.
The setter queues an update; it does not change the current render's snapshot.
Use an updater when next state depends on previous state. React can skip updates whose value is unchanged by Object.is.
A lazy initializer such as `useState(() => calculateInitialValue())` avoids recalculating the initial value on ordinary rerenders; it must be pure.

#### useEffect

**Formal definition:** `useEffect` declares synchronization logic with an external system. React runs its setup after committing the component and can run a returned cleanup before dependency-driven setup reruns and when the component unmounts.

```tsx
import { useEffect, useState } from "react";

function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timerId = setInterval(() => {
      setSeconds((previous) => {
        return previous + 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  return <p>Seconds: {seconds}</p>;
}
```

The setup connects to a timer; cleanup disconnects it.
The updater means the effect does not need to read seconds, so no changing state dependency is required here.
Effects run only on the client. Dependencies are compared with Object.is and must include reactive values read by the effect.
An empty list is not an absolute guarantee of one execution: remounting and development Strict Mode can run setup again.
An effect callback must not be async because it must return cleanup or nothing, not a promise.

#### useContext

**Formal definition:** `useContext` reads and subscribes to a context value supplied by the nearest matching provider above the calling component in the React tree.

```tsx
import { createContext, useContext } from "react";

const ThemeContext = createContext("light");

function ThemeLabel() {
  const theme = useContext(ThemeContext);
  return <p>Theme: {theme}</p>;
}

function ThemeExample() {
  return (
    <ThemeContext.Provider value="dark">
      <ThemeLabel />
    </ThemeContext.Provider>
  );
}
```

ThemeLabel reads dark without an explicit theme prop.
Without a matching provider, it reads the default light value.
When the provider value changes by Object.is comparison, its context consumers update.
Context distributes values; it does not create state by itself. A provider can distribute useState values and setters.
Typical uses include theme, locale, and authentication information.

#### useRef

**Formal definition:** `useRef` returns a stable, mutable object with a current property that persists across renders. Updating current does not request rendering.

```tsx
import { useRef } from "react";

function FocusInput() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <input ref={inputRef} aria-label="Task name" />
      <button
        type="button"
        onClick={() => {
          inputRef.current?.focus();
        }}
      >
        Focus input
      </button>
    </>
  );
}
```

React attaches the input DOM node to current and resets it to null on removal.
Optional chaining handles null safely.
In this example, the ref object itself does not change between renders. Its current property changes from null to the actual DOM input when React attaches it.
Clicking Focus does not replace the ref object or change current: it calls focus on the existing DOM input. Browser focus changes, not React state.
Refs also retain nonvisual values such as timer IDs. If a changed value must update displayed UI, use state instead.
Do not routinely read/write refs during rendering; event handlers and effects are appropriate.

#### useReducer

**Formal definition:** `useReducer` declares state managed by a reducer and returns the current state and a dispatch function. Dispatching an action asks React to calculate next state by calling the reducer with the current state and that action.

```tsx
import { useReducer } from "react";

type Action = { type: "increment" } | { type: "reset" };

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case "increment":
      return state + 1;
    case "reset":
      return 0;
  }
}

function ReducerCounter() {
  const [count, dispatch] = useReducer(reducer, 0);

  return (
    <>
      <p>Count: {count}</p>
      <button
        type="button"
        onClick={() => {
          dispatch({ type: "increment" });
        }}
      >
        Increment
      </button>
      <button
        type="button"
        onClick={() => {
          dispatch({ type: "reset" });
        }}
      >
        Reset
      </button>
    </>
  );
}
```

The reducer must be pure and return next state rather than mutate existing state.
Useful for related transitions, complex forms, and explicit action-based updates; simple state can remain useState.
It does not automatically make state global.

#### useMemo

**Formal definition:** `useMemo` caches the result of a pure calculation between renders, reusing it while the listed dependencies remain unchanged by Object.is comparison.

```tsx
import { useMemo } from "react";

type Product = { id: number; name: string };
type ProductListProps = { products: Product[]; search: string };

function ProductList({ products, search }: ProductListProps) {
  const matchingProducts = useMemo(() => {
    return products.filter((product) => {
      return product.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [products, search]);

  return (
    <ul>
      {matchingProducts.map((product) => {
        return <li key={product.id}>{product.name}</li>;
      })}
    </ul>
  );
}
```

If products and search are unchanged, React can reuse the previous result.
For tiny lists, plain filtering is usually simpler and sufficient.
A newly created array dependency counts as changed even if its contents look equal.
The calculation runs during rendering and must be pure. The cache is a performance optimization, not permanent storage or a correctness guarantee.

#### useEffect versus useMemo

They both accept a function and dependencies, but solve different problems.

| | useEffect | useMemo |
|---|---|---|
| Purpose | Synchronize with an external system | Cache a pure calculation |
| Timing | Setup after commit | Calculation during render |
| Callback return | Cleanup function or nothing | The calculated value |
| Hook return | undefined | The calculated/cached value |
| Examples | Requests, subscriptions, timers | Expensive filtering or totals |

Use ordinary derived calculations first; add useMemo only when useful for performance.
Do not use an effect plus extra state just to calculate filtered items: that adds an unnecessary render and synchronization.
Do not fetch, set state, or perform side effects inside a useMemo calculation.
Matching dependency syntax does not mean matching behavior.

#### useCallback

**Formal definition:** `useCallback` caches a function reference between renders, returning the same reference while its listed dependencies remain unchanged by Object.is comparison.

```tsx
import { useCallback } from "react";

type SavePanelProps = {
  documentId: string;
  onSave: (id: string) => void;
};

function SavePanel({ documentId, onSave }: SavePanelProps) {
  const handleSave = useCallback(() => {
    onSave(documentId);
  }, [documentId, onSave]);

  return (
    <button type="button" onClick={handleSave}>
      Save
    </button>
  );
}
```

Calling useCallback does not execute handleSave; clicking the button does.
React returns the cached function reference when dependencies are unchanged.
Most useful when reference stability matters, such as passing a callback to a memoized child.
It does not itself prevent child renders or make execution faster. For this simple button alone, an ordinary handler is sufficient.
Omitting dependencies can capture outdated values (a stale closure).

### Promises: definition and states

A promise is a JavaScript object representing the eventual completion or failure of an operation and its resulting value or rejection reason.
It does not itself make synchronous work run in the background.

- Pending: neither fulfilled nor rejected.
- Fulfilled: completed with a value.
- Rejected: failed with a reason, which need not be an Error object.
- Settled: fulfilled or rejected, not a fourth state. A promise cannot change state after settling.
- Resolved is not synonymous with fulfilled: a promise can adopt a still-pending promise's outcome.

```js
const promise = new Promise((resolve, reject) => {
  resolve("Success");
});
```

The executor runs synchronously. Handlers registered with `.then` run asynchronously as microtasks.

| Method | Meaning |
|---|---|
| `.then(onFulfilled)` | Handles fulfillment; returns a new promise. A second argument can handle rejection. |
| `.catch(onRejected)` | Handles rejection; returns a new promise. |
| `.finally(onFinally)` | Runs after settlement for cleanup, without receiving the result or reason. Normally preserves the outcome. |

Returning from a handler fulfills/adopts the next promise; throwing rejects it.
A catch that returns normally can recover from failure.
A finally callback that throws or returns a rejected promise changes the resulting promise to a rejection.

### Promise chaining: return values and recovery

Each then/catch call returns a new promise. A handler's return determines the next promise's outcome.

```js
Promise.resolve(2)
  .then((number) => {
    return number * 3;
  })
  .then((number) => {
    return number + 1;
  })
  .then((result) => {
    console.log(result);
  });
// 7
```

- Return a normal value: the next promise fulfills with that value.
- Return another promise: the next promise adopts its eventual outcome.
- Throw: the next promise rejects and the chain skips fulfillment handlers until a rejection handler.
- Omit return: a normally completing handler yields undefined; logging is not a substitute for returning data.
- A catch that returns a value recovers the chain; a catch that throws keeps it rejected.

Catch does not turn the original rejected promise into a fulfilled one.
It returns a new promise: if the rejection handler returns normally, that new promise fulfills with the returned value (or undefined).
If the handler throws, that new promise rejects with the thrown reason.
Use `throw error` inside catch to rethrow the original error so a later catch can handle it.
Returning an Error object is still a normal fulfillment value; `return error` and `throw error` are different.

```js
Promise.resolve()
  .then(() => {
    throw new Error("Failed");
  })
  .catch((error) => {
    console.log(error.message);
    return "Recovered";
  })
  .then((value) => {
    console.log(value);
  });
// Failed
// Recovered
```

Return promises from handlers when the following step must wait for them.
For example, `return fetch(url)` followed by `return response.json()` connects the request and body parsing into one chain.

### Promise combinators (not different promise states)

#### Formal definitions

- **Promise.all(iterable):** Returns a promise that fulfills with an array of fulfillment values, in input order, when all inputs fulfill, or rejects with the first observed rejection reason.
- **Promise.allSettled(iterable):** Returns a promise that fulfills after all inputs settle, with an array of outcome records in input order. Each record contains status and either value or reason.
- **Promise.race(iterable):** Returns a promise that adopts the fulfillment value or rejection reason of the first input to settle.
- **Promise.any(iterable):** Returns a promise that fulfills with the first observed fulfillment value, or rejects with an AggregateError if all inputs reject. Its errors are ordered by input position.

Each accepts an iterable of promises and/or ordinary values; ordinary values are treated as fulfilled promises.
These definitions describe coordination of valid inputs, not cancellation or execution on separate threads.

| Method | Success condition | Failure condition | Empty iterable |
|---|---|---|---|
| `Promise.all` | All fulfill; values in input order | Rejects on the first observed rejection | Fulfills with `[]` |
| `Promise.allSettled` | Waits for every outcome; records in input order | Input rejections become outcome records | Fulfills with `[]` |
| `Promise.race` | First settlement wins, including rejection | Rejects if that first settlement is a rejection | Stays pending |
| `Promise.any` | First fulfillment wins | Rejects with AggregateError when all reject; errors in input order | Rejects with AggregateError |

These are the normal behaviors for valid iterables and ordinary promises/values; invalid inputs can cause rejection.
None of these methods automatically cancels the other operations.
Already-settled promises still invoke their handlers asynchronously.

### Runnable promise-combinator examples

```js
Promise.all([
  Promise.resolve("Users"),
  Promise.resolve("Posts"),
]).then((values) => {
  console.log(values); // ["Users", "Posts"]
});

Promise.allSettled([
  Promise.resolve("Users"),
  Promise.reject("Posts failed"),
]).then((outcomes) => {
  console.log(outcomes);
  // [
  //   { status: "fulfilled", value: "Users" },
  //   { status: "rejected", reason: "Posts failed" }
  // ]
});

Promise.any([
  Promise.reject("Server A failed"),
  Promise.resolve("Server B succeeded"),
])
  .then((value) => {
    console.log(value); // "Server B succeeded"
  })
  .catch((error) => {
    console.error(error); // Handles the case where every input rejects.
  });
```

For race, attach handlers immediately after constructing the inputs:

```js
const slow = new Promise((resolve) => {
  setTimeout(() => {
    resolve("Slow");
  }, 1000);
});

const fast = new Promise((resolve) => {
  setTimeout(() => {
    resolve("Fast");
  }, 100);
});

Promise.race([slow, fast]).then((value) => {
  console.log(value); // "Fast"
});
```

If these same inputs were passed to all, the result would be ["Slow", "Fast"] after both fulfill: input order, not completion order.
The slow operation continues after race settles.
Promise.all does not start requests itself: expressions such as fetch(url) start them when evaluated; all coordinates their outcomes.

### Promise.all: interview implementation

Practice this standalone vanilla-JavaScript function in the browser console; do not overwrite native Promise.all.

```js
function myPromiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = [...iterable];
    const results = new Array(items.length);
    let completed = 0;

    if (items.length === 0) {
      resolve([]);
      return;
    }

    items.forEach((item, index) => {
      Promise.resolve(item).then((value) => {
        results[index] = value;
        completed++;

        if (completed === items.length) {
          resolve(results);
        }
      }, reject);
    });
  });
}
```

- The Promise constructor supplies resolve/reject and converts synchronous executor exceptions to rejection.
- Spread accepts iterable inputs and rejects non-iterables through the executor.
- Promise.resolve handles both promises and plain values.
- Write to the original index, not push: completion order can differ from input order.
- Increment completed after fulfillment; resolve only after every input fulfills.
- The rejection handler forwards the first observed rejection; subsequent settle attempts cannot change the returned promise.
- The positional contract of native `.then(onFulfilled, onRejected)` determines the handlers' roles, not their names or contents. Promise machinery invokes the first function with the fulfillment value or the second with the rejection reason. Passing outer `reject` as that second function forwards the input's rejection.
- Handle empty input explicitly or the result would remain pending.
- The callbacks share results and completed through closures.
- This eagerly consumes the iterable before subscribing to its promises. It covers the exercise's main behaviors but is not a full native implementation of iteration/thenable edge cases or Promise subclass behavior.
- No input is cancelled when the returned promise rejects.

Test cases: empty input, plain values, out-of-order fulfillment, rejection, a Set iterable, and invalid input.

### async/await

- An async function always returns a promise.
- Await suspends that async function until a promise settles, without blocking the browser.
- Fulfillment produces the awaited value; rejection throws at the await point and can be handled with try/catch.
- Async code before the first await runs synchronously.

### Spoken revision checklist

Explain in your own words:

1. What a Hook is, then useState and useEffect.
2. How state differs from a ref.
3. How useMemo differs from useCallback.
4. What a promise is and its three states.
5. How all, allSettled, race, and any differ.

## this, call, apply, and bind: native usage

Before implementing these methods, understand how a normal function gets its receiver.

```js
function introduce(greeting, punctuation) {
  return greeting + ", " + this.name + punctuation;
}

const person = { name: "Alex" };

introduce.call(person, "Hello", "!");      // "Hello, Alex!"
introduce.apply(person, ["Hello", "!"]);   // "Hello, Alex!"

const introduceAlex = introduce.bind(person, "Hello");
introduceAlex("!");                       // "Hello, Alex!"
```

- `this` is not a parameter declared in the function signature.
- For ordinary method calls, the receiver before the dot supplies `this`: `person.method()`.
- `call` invokes immediately with an explicit `this` and separate arguments.
- `apply` invokes immediately with an explicit `this` and an array-like argument list.
- `bind` returns a new function with bound `this` and optionally prefilled arguments; it does not immediately execute the original.
- The `person` argument sets `this`; it does not become the `greeting` parameter.
- Arrow functions capture lexical `this`; call/apply/bind cannot replace an arrow's `this`.
- Standalone normal-function `this` depends on strict mode; do not assume it always means the window.
- A new constructor call has additional rules: native bound functions ignore the bound `this` when invoked with `new`. A basic bind wrapper is not a full native-bind replacement.
- Interview implementations are available below; independent reproduction practice is still pending.

### Remaining implementations: runnable revision file

#### What an interviewer may ask

- Explain differences between call, apply, and bind, including argument formats and immediate versus deferred execution.
- Predict this/output for a borrowed method or bound function.
- Implement a method without using its native equivalent; ask whether Reflect.apply is permitted.
- Demonstrate returned values, argument forwarding, partial application, and error propagation.
- Clarify whether constructors/new, primitives/null, frozen receivers, or strict-mode semantics must be supported.

Do not claim to know the interview's exact questions. The recruiter-confirmed priority remains taking a frontend problem to a working solution.

Suggested implementation narration: "call invokes a function with an explicit receiver and arguments; apply changes the argument format; bind returns a wrapper that remembers the receiver and prepends arguments."
The Reflect.apply versions below are concise but may not satisfy a from-scratch restriction.

A commonly taught no-Reflect technique attaches the target function to an object receiver under a unique Symbol, invokes it as a method, and removes it in finally. This is intentionally limited, not a fully compliant polyfill:

```js
Function.prototype.myCallBasic = function (context, ...args) {
  if (typeof this !== "function") {
    throw new TypeError("Receiver must be a function");
  }

  const receiver = context == null ? globalThis : Object(context);
  const key = Symbol("temporaryMethod");

  Object.defineProperty(receiver, key, {
    value: this,
    configurable: true,
  });

  try {
    return receiver[key](...args);
  } finally {
    delete receiver[key];
  }
};
```

The method call supplies receiver as this. Symbol avoids property-name collisions, and finally removes the temporary property even if the target throws.
This models non-strict-style receiver conversion; it does not preserve strict functions' null/primitive this, fails on non-extensible receivers, and has other observable mutation/proxy differences from native call.
State those limitations instead of presenting it as universal.

See [practice/polyfills.js](./practice/polyfills.js) for:

- `myPromiseAllSettled`: record each outcome at its input index; resolve after every input settles.
- `myPromiseRace`: connect every input to the same resolve/reject pair; first settlement wins.
- `myPromiseAny`: resolve on the first fulfillment; collect rejection reasons by input index and reject with AggregateError only when every input rejects.
- `myCall`, `myApply`, and `myBind`: function-method implementations using Reflect.apply as the invocation primitive.

Run this from the project directory to try the exports:

```sh
node --input-type=module
```

```js
const {
  myPromiseAllSettled, myPromiseRace, myPromiseAny,
  myCall, myApply, myBind
} = await import("./practice/polyfills.js");

function introduce(greeting, punctuation) {
  return greeting + ", " + this.name + punctuation;
}

// Install only practice names; these are not native replacements.
Function.prototype.myCall = myCall;
Function.prototype.myApply = myApply;
Function.prototype.myBind = myBind;

introduce.myCall({ name: "Alex" }, "Hi", "!");
introduce.myApply({ name: "Alex" }, ["Hi", "!"]);
const bound = introduce.myBind({ name: "Alex" }, "Hi");
bound("!");

await myPromiseAllSettled([Promise.resolve(1), Promise.reject("failed")]);
await myPromiseRace([Promise.resolve("first"), Promise.resolve("second")]);
await myPromiseAny([Promise.reject("failed"), Promise.resolve("success")]);
```

#### Scope and interview caveats

- Function implementations do not call native call/apply/bind. They use Reflect.apply, which is an existing invocation primitive; disclose this and check whether it is allowed in the exercise.
- `myCall` supplies separate arguments; `myApply` accepts an array-like argument list, with null/undefined meaning no arguments.
- `myBind` preserves bound context and prepends arguments using a closure, but intentionally does not implement native constructor/new behavior or native name/length metadata. The returned arrow cannot be constructed.
- If Reflect.apply and other invocation primitives are forbidden, a common teaching alternative temporarily attaches the function to the context using a Symbol, invokes it as a method, and removes it in finally. That alternative is not fully correct: frozen/non-extensible receivers and primitive/null/strict-this semantics need additional treatment. Do not claim it is a universal replacement.
- Promise implementations normalize inputs with Promise.resolve, preserve required input ordering, and handle empty inputs.
- These are interview implementations, not fully specification-compliant polyfills: eager iterable materialization in allSettled/any, exotic thenables/iterators, subclassing, and native property descriptors are not fully reproduced.
- Empty results: allSettled fulfills with []; race stays pending; any rejects with AggregateError.
- None cancels other operations. A callback returning an Error object is fulfillment; a thrown error is rejection.

## JavaScript coercion: plus with strings

For primitive string/number operands, `+` concatenates if either operand is a string; otherwise it performs numeric addition.
In `letter + index`, `"a" + 0` produces `"a0"`: the number is converted to a string, not the letter to a number.
This automatic conversion is called type coercion, not a TypeScript type assertion.

```js
"5" + 2;         // "52"
5 + 2;           // 7
Number("5") + 2; // 7
Number("a");     // NaN
"5" - 2;         // 3
"a" - 2;         // NaN
```

Minus does not concatenate: it attempts numeric conversion.
Evaluation order also matters: `1 + 2 + "3"` is `"33"`, whereas `"1" + 2 + 3` is `"123"`.
These rules describe the string/number examples here; objects first undergo primitive conversion, and other types have additional rules.

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
