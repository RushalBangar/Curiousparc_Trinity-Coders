/**
 * SkillBridge Technical Competency Question Bank
 * Provides rich, verified multiple-choice questions per technical skill.
 * Selects 10 randomized questions with randomized options per assessment.
 */

const SKILL_QUESTION_BANKS = {
    "python": [
        {
            q: "What is the primary mechanism of memory management and automatic cleanup in standard CPython?",
            options: ["Reference counting combined with a cyclic garbage collector", "Manual pointer deallocation like malloc/free", "Generational mark-and-sweep only without reference counters", "Immediate stack destruction upon function exit"],
            ans: 0,
            explanation: "CPython primarily uses reference counting for immediate cleanup and a generational garbage collector to detect circular references."
        },
        {
            q: "What will `def append_to(item, target=[]): target.append(item); return target` do when called repeatedly without a second argument?",
            options: ["It accumulates items in the same list across calls because default arguments are evaluated once at definition time", "It creates a fresh empty list on every call", "It raises a TypeError because mutable defaults are illegal", "It resets the default argument after returning"],
            ans: 0,
            explanation: "In Python, default arguments are evaluated once when the function is defined, making mutable defaults like lists shared across all invocations."
        },
        {
            q: "Which built-in Python module provides cooperative multitasking via event loops, coroutines, and tasks?",
            options: ["asyncio", "multiprocessing", "threading", "concurrent.futures"],
            ans: 0,
            explanation: "asyncio is Python's standard library module for writing single-threaded concurrent code using coroutines and an event loop."
        },
        {
            q: "What does the Global Interpreter Lock (GIL) in CPython prevent?",
            options: ["Multiple native threads from executing Python bytecodes simultaneously", "Multiple processes from sharing system memory", "Running asynchronous I/O concurrently", "Executing compiled C extensions"],
            ans: 0,
            explanation: "The GIL ensures that only one native OS thread executes Python bytecode at any given moment inside a single CPython process."
        },
        {
            q: "How does a generator function in Python differ from a standard function?",
            options: ["It uses the `yield` keyword to produce values lazily and maintains its execution state across iterations", "It compiles directly to native C assembly code", "It executes asynchronously on a separate thread pool", "It returns all computed values stored in a contiguous array"],
            ans: 0,
            explanation: "Generators use `yield` to yield values on demand and pause execution, preserving local state between iterations without loading all data into memory."
        },
        {
            q: "What dunder method must an object implement to be usable as a context manager with the `with` statement?",
            options: ["__enter__ and __exit__", "__init__ and __del__", "__open__ and __close__", "__start__ and __stop__"],
            ans: 0,
            explanation: "Context managers in Python require `__enter__()` and `__exit__()` to manage resource acquisition and teardown."
        },
        {
            q: "What is the time complexity of looking up a key in a standard Python dictionary in the average case?",
            options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
            ans: 0,
            explanation: "Python dictionaries are implemented using high-performance hash tables with amortized O(1) lookup complexity."
        },
        {
            q: "What does `@functools.wraps(fn)` achieve when writing a custom function decorator?",
            options: ["It preserves the original function's name, docstring, and metadata on the wrapper function", "It compiles the wrapped function using JIT optimization", "It automatically runs the function in a background thread", "It prevents exceptions inside the function from bubbling up"],
            ans: 0,
            explanation: "`functools.wraps` copies metadata like `__name__` and `__doc__` from the decorated function to the wrapper."
        },
        {
            q: "In Python 3, what is the result of `type(int)`?",
            options: ["<class 'type'>", "<class 'int'>", "<class 'object'>", "<class 'primitive'>"],
            ans: 0,
            explanation: "In Python's unified object model, classes are themselves instances of the metaclass `type`."
        },
        {
            q: "What is the difference between `is` and `==` in Python?",
            options: ["`is` checks for object identity (same memory address), while `==` checks for equality of values", "`==` checks memory addresses, while `is` compares values", "They are identical synonyms in Python 3", "`is` is only used for checking boolean True/False"],
            ans: 0,
            explanation: "`is` evaluates whether two variables point to the exact same object in memory (`id(a) == id(b)`), whereas `==` invokes `__eq__` to compare values."
        },
        {
            q: "Which expression creates a shallow copy of a list named `data`?",
            options: ["data[:]", "data.copy_deep()", "data.clone()", "data.reference()"],
            ans: 0,
            explanation: "Slicing `data[:]` or `list(data)` or `data.copy()` returns a shallow copy of the list."
        },
        {
            q: "What does the `*args` syntax in a Python function definition allow?",
            options: ["Passing an arbitrary number of positional arguments as a tuple", "Passing keyword arguments as a dictionary", "Restricting inputs to only integer values", "Passing pointers to variables by reference"],
            ans: 0,
            explanation: "`*args` captures excess positional arguments into a tuple, while `**kwargs` captures keyword arguments into a dictionary."
        },
        {
            q: "What will `[x**2 for x in range(5) if x % 2 == 0]` evaluate to?",
            options: ["[0, 4, 16]", "[0, 1, 4, 9, 16]", "[4, 16]", "[0, 2, 4]"],
            ans: 0,
            explanation: "The even numbers in range(5) are 0, 2, and 4. Their squares are 0, 4, and 16."
        },
        {
            q: "How does Python's `dataclasses` module improve standard class definitions?",
            options: ["It automatically synthesizes `__init__`, `__repr__`, `__eq__`, and other boilerplate methods based on type hints", "It compiles Python classes into C structs for faster execution", "It enforces runtime database synchronization", "It prevents subclasses from inheriting the class"],
            ans: 0,
            explanation: "The `@dataclass` decorator inspects class annotations and generates standard dunder methods like `__init__`, `__repr__`, and `__eq__` automatically."
        },
        {
            q: "What happens if an exception is raised inside a `try` block and handled in an `except` block, but a `finally` block is also defined?",
            options: ["The `finally` block always executes regardless of whether an exception occurred or was handled", "The `finally` block only executes if no exception occurred", "The `finally` block replaces the `except` block", "The `finally` block is skipped if the exception is caught"],
            ans: 0,
            explanation: "Code in a `finally` clause is guaranteed to run before exiting the `try...except` statement, even if returns or unhandled exceptions occur."
        }
    ],

    "javascript": [
        {
            q: "What is a closure in JavaScript?",
            options: ["A function bundled together with references to its surrounding lexical environment", "A method to immediately terminate an execution thread", "A syntax for closing open network sockets", "An object that cannot receive any new properties"],
            ans: 0,
            explanation: "A closure gives an inner function access to an outer function's scope even after the outer function has closed."
        },
        {
            q: "What is the output of `console.log(typeof null)` in JavaScript?",
            options: ["'object'", "'null'", "'undefined'", "'boolean'"],
            ans: 0,
            explanation: "`typeof null` returning 'object' is a historical legacy bug in JavaScript that remains for backwards compatibility."
        },
        {
            q: "What queue do resolved Promise microtasks go into in the JavaScript event loop?",
            options: ["Microtask Queue (executed before macrotasks)", "Macrotask / Callback Queue", "Render Queue", "Call Stack directly without queuing"],
            ans: 0,
            explanation: "Promise callbacks (`.then`, `.catch`, `await`) are enqueued into the microtask queue, which is drained after each macrotask before rendering."
        },
        {
            q: "How does `let` and `const` differ from `var` regarding scoping and hoisting?",
            options: ["`let` and `const` are block-scoped and live in a Temporal Dead Zone until initialized; `var` is function-scoped", "`var` is block-scoped, while `let` is globally scoped", "`let` and `const` cannot be reassigned; `var` is immutable", "`var` throws ReferenceErrors when accessed before declaration"],
            ans: 0,
            explanation: "`let` and `const` declare variables scoped to the nearest enclosing block (`{}`) and enter the Temporal Dead Zone before initialization."
        },
        {
            q: "What does `Array.prototype.map()` return?",
            options: ["A new array containing the results of calling a provided function on every element", "The original array mutated in-place", "A boolean indicating if every element matched a condition", "A single accumulated value"],
            ans: 0,
            explanation: "`map()` is an immutable method that returns a brand new array populated with the results of invoking the callback on each element."
        },
        {
            q: "What is the difference between `==` and `===` in JavaScript?",
            options: ["`===` compares values and types without type coercion, while `==` performs implicit type coercion", "`==` is strict equality, while `===` checks references only", "They are identical in modern ES6+ code", "`===` converts both operands to strings before comparing"],
            ans: 0,
            explanation: "`===` (strict equality) returns false if types differ, whereas `==` coerces types according to ECMAScript abstract equality rules."
        },
        {
            q: "What happens when you invoke `Object.freeze(obj)` on an object?",
            options: ["Properties cannot be added, deleted, or modified, making top-level properties immutable", "The object is encrypted in memory", "All nested child objects are recursively made immutable automatically", "The object is converted to JSON format"],
            ans: 0,
            explanation: "`Object.freeze()` prevents modifications to existing top-level properties and prevents adding/deleting properties (shallow freeze)."
        },
        {
            q: "How does the `this` keyword behave inside an ES6 arrow function?",
            options: ["It retains the lexical `this` value of the enclosing scope where it was defined", "It dynamically binds to the element that called the function", "It is always bound to `globalThis` / `window`", "It is undefined unless explicitly bound with `.bind()`"],
            ans: 0,
            explanation: "Arrow functions do not have their own `this` binding; they resolve `this` lexically from the surrounding execution context."
        },
        {
            q: "Which method schedules a function to run after the current call stack clears, in the macrotask queue?",
            options: ["setTimeout(fn, 0)", "queueMicrotask(fn)", "Promise.resolve().then(fn)", "process.nextTick(fn)"],
            ans: 0,
            explanation: "`setTimeout` enqueues callbacks into the browser macrotask queue (timer task list)."
        },
        {
            q: "What will `[1, 2, 3] + [4, 5, 6]` evaluate to in JavaScript?",
            options: ["'1,2,34,5,6' (both arrays coerced to strings and concatenated)", "[1, 2, 3, 4, 5, 6]", "NaN", "TypeError: Cannot add arrays"],
            ans: 0,
            explanation: "The `+` operator coerces arrays to strings via `toString()`, resulting in `'1,2,3' + '4,5,6' = '1,2,34,5,6'`."
        },
        {
            q: "What is the purpose of `WeakMap` in JavaScript?",
            options: ["Storing key/value pairs where keys must be objects and are held weakly for garbage collection", "Storing numerical keys sorted in ascending order", "Encrypting sensitive key-value data", "Providing a thread-safe map implementation"],
            ans: 0,
            explanation: "`WeakMap` keys must be objects and do not prevent garbage collection of those objects when no other references exist."
        },
        {
            q: "What does event delegation in the DOM leverage?",
            options: ["Event bubbling to handle events on parent containers rather than multiple child listeners", "Direct socket streaming to server workers", "Capturing phase suppression to speed up render times", "Worker threads to process mouse events"],
            ans: 0,
            explanation: "Event delegation exploits event bubbling, where events trigger on children and propagate up to a single listener on an ancestor element."
        },
        {
            q: "What is the output of `Boolean('false')` in JavaScript?",
            options: ["true", "false", "NaN", "TypeError"],
            ans: 0,
            explanation: "Any non-empty string in JavaScript evaluates to `true` when converted to boolean, even `'false'` or `'0'`."
        },
        {
            q: "Which Web API allows running CPU-intensive JavaScript code in background threads without freezing the main UI thread?",
            options: ["Web Workers", "WebSockets", "IntersectionObserver", "Service Workers cache"],
            ans: 0,
            explanation: "Web Workers run scripts in background threads, communicating with the main thread via message passing without blocking the UI."
        },
        {
            q: "What does `Promise.allSettled()` do when passed an array of promises?",
            options: ["Waits for all promises to either resolve or reject and returns an array of outcome objects", "Rejects immediately when the first promise rejects", "Resolves with the value of whichever promise completes fastest", "Executes promises strictly sequentially"],
            ans: 0,
            explanation: "`Promise.allSettled()` never short-circuits on rejection; it returns status (`fulfilled` or `rejected`) and values for all promises."
        }
    ],

    "typescript": [
        {
            q: "What does the `unknown` type represent in TypeScript compared to `any`?",
            options: ["A type-safe counterpart of `any` that requires type narrowing before performing operations on it", "A type that can never occur or return a value", "An alias for `undefined | null`", "A variable that has been deprecated"],
            ans: 0,
            explanation: "`unknown` is type-safe: you cannot invoke methods or access properties on an `unknown` value without first verifying or narrowing its type."
        },
        {
            q: "What does the utility type `Partial<T>` do in TypeScript?",
            options: ["Constructs a type with all properties of T set to optional (`?`)", "Removes all nullable properties from T", "Selects only properties of type string from T", "Marks all properties of T as readonly"],
            ans: 0,
            explanation: "`Partial<T>` transforms `{ [P in keyof T]?: T[P] }`, making every field in `T` optional."
        },
        {
            q: "What is the `never` type used for in TypeScript?",
            options: ["Representing values that will never occur, such as unreachable switch branches or functions that throw", "Representing unassigned variables before initialization", "Representing nullable database values", "Denoting an empty array type"],
            ans: 0,
            explanation: "`never` represents values that can never happen, commonly used in exhaustive switch checks and functions with infinite loops or unconditional throws."
        },
        {
            q: "What does the `keyof` operator return in TypeScript?",
            options: ["A union type consisting of the known property names (keys) of an object type", "An array of runtime object keys", "The number of fields defined in an interface", "The type of the primary key field"],
            ans: 0,
            explanation: "`keyof T` produces a union of string/number literal types representing the keys of `T`."
        },
        {
            q: "How does `interface` differ from `type` alias regarding declaration merging?",
            options: ["Interfaces with the same name automatically merge their declarations; type aliases cannot be declared multiple times", "Type aliases support declaration merging; interfaces do not", "Neither supports merging in modern TypeScript", "Declaration merging only works in `.d.ts` files"],
            ans: 0,
            explanation: "Multiple `interface` blocks with the same name in the same scope merge together; attempting this with `type` triggers a duplicate identifier error."
        },
        {
            q: "What does the TypeScript utility type `Record<K, T>` construct?",
            options: ["An object type whose property keys are K and property values are T", "A tuple containing K elements of type T", "A database record model with CRUD helpers", "A readonly array of keys"],
            ans: 0,
            explanation: "`Record<Keys, Type>` constructs an object type where keys come from `Keys` and values are of `Type`."
        },
        {
            q: "What does the `as const` assertion (const assertion) do to an object literal?",
            options: ["Makes all properties deeply readonly and narrows literal values to their exact literal types", "Freezes the object at runtime using Object.freeze()", "Converts the object to an immutable Map", "Compiles the object into an enum"],
            ans: 0,
            explanation: "`as const` signals to the compiler that properties are readonly and types should be narrowed to literal types rather than widened to `string`, `number`, etc."
        },
        {
            q: "What is a generic constraint in TypeScript syntax?",
            options: ["Using `extends` in a type parameter list (e.g. `<T extends { id: string }>` to restrict permissible types)", "Wrapping types in `typeof` checks", "Marking types as `private` or `protected`", "Restricting functions to only accept primitives"],
            ans: 0,
            explanation: "Generic constraints use `<T extends BaseType>` to enforce that `T` has at least the structural shape of `BaseType`."
        },
        {
            q: "What does a custom Type Guard function return to narrow a type?",
            options: ["A type predicate in the form `parameterName is Type` as its return type", "A boolean value with no special annotation", "An instance of the target class", "A string containing the type name"],
            ans: 0,
            explanation: "User-defined type guards use the syntax `function isFish(pet: Pet): pet is Fish` to inform the TypeScript compiler of type narrowing upon returning true."
        },
        {
            q: "What is the purpose of ambient declarations (`declare`) in TypeScript?",
            options: ["Describing the shape of code that exists elsewhere (like external JavaScript libraries or browser globals) without generating JavaScript code", "Declaring reactive state in UI components", "Setting environment variables at compile-time", "Allocating shared memory buffers"],
            ans: 0,
            explanation: "`declare` tells the compiler that a variable or module exists in the runtime environment, generating zero output JavaScript."
        }
    ],

    "react": [
        {
            q: "What is the primary rule regarding the invocation of React Hooks?",
            options: ["Hooks must only be called at the top level of function components and custom hooks, never inside loops, conditions, or nested functions", "Hooks can only be called inside class components", "Hooks must always be called inside `useEffect`", "Hooks must be called after the return statement"],
            ans: 0,
            explanation: "React relies on the call order of hooks to preserve state between renders, so hooks must never be called conditionally or inside loops."
        },
        {
            q: "What is the purpose of the cleanup function returned inside a `useEffect` callback?",
            options: ["To clean up subscriptions, timers, or abort network requests before the component unmounts or before the effect runs again", "To clear the browser's local storage", "To garbage-collect all unused React component instances", "To reset the component's state to initial defaults"],
            ans: 0,
            explanation: "Returning a function from `useEffect` allows developers to tear down side effects before re-running the effect or unmounting the component."
        },
        {
            q: "What is the difference between `useMemo` and `useCallback` in React?",
            options: ["`useMemo` caches the calculated result of a function, while `useCallback` caches the function instance itself", "`useCallback` caches computed values; `useMemo` caches JSX elements", "`useMemo` runs synchronously before rendering; `useCallback` runs after rendering", "They are exact aliases with no functional difference"],
            ans: 0,
            explanation: "`useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`. `useMemo` returns a memoized value; `useCallback` returns a memoized callback function."
        },
        {
            q: "Why must list elements rendered in React have a unique `key` prop?",
            options: ["To help React's reconciliation algorithm identify which items have changed, been added, or been removed across renders", "To apply CSS styles by key identifier", "To enable indexing in browser search engines", "To prevent React components from re-rendering completely"],
            ans: 0,
            explanation: "Keys give elements a stable identity across renders, allowing the virtual DOM diffing algorithm to reuse DOM nodes efficiently."
        },
        {
            q: "What does `React.memo()` do when wrapping a functional component?",
            options: ["Performs a shallow comparison of props and skips re-rendering if props have not changed", "Persists component state in localStorage across page reloads", "Converts the functional component into a class component", "Ensures the component is only rendered once per user session"],
            ans: 0,
            explanation: "`React.memo` is a higher-order component that memoizes the rendered output, skipping re-rendering when props remain shallowly equal."
        },
        {
            q: "In React 18, what is Automatic Batching?",
            options: ["Grouping multiple state updates into a single re-render, even inside promises, setTimeout, and native event handlers", "Batch compiling JSX files during build time", "Executing multiple network requests in a single HTTP packet", "Combining multiple components into a single file bundle"],
            ans: 0,
            explanation: "React 18 batches state updates together automatically across all contexts (promises, timeouts, native events) to minimize re-renders."
        },
        {
            q: "What problem does the React Context API solve?",
            options: ["Prop drilling (passing props through intermediate components that do not need them)", "Server-side database connection pooling", "Caching HTTP GET requests in the browser", "Replacing Redux for all application logic"],
            ans: 0,
            explanation: "React Context provides a way to pass data down the component tree without manually passing props through every level."
        },
        {
            q: "How does the `useRef` hook differ from `useState`?",
            options: ["Mutating `ref.current` does not trigger a component re-render; updating state triggers a re-render", "`useRef` can only store DOM elements, not objects or primitives", "`useState` values are lost between renders; `useRef` is persisted", "`useRef` values cannot be modified once set"],
            ans: 0,
            explanation: "`useRef` holds a mutable `.current` property that persists for the full lifetime of the component without triggering a re-render when mutated."
        },
        {
            q: "What is the purpose of React Error Boundaries?",
            options: ["To catch JavaScript errors in their child component tree, log them, and render a fallback UI instead of crashing the entire component tree", "To handle 404 and 500 HTTP server response errors", "To validate TypeScript types at runtime", "To catch syntax errors in JSX during compilation"],
            ans: 0,
            explanation: "Error Boundaries are React components that implement `componentDidCatch` or `static getDerivedStateFromError` to catch rendering errors in child components."
        },
        {
            q: "What is React Fiber?",
            options: ["React's underlying reconciliation engine and virtual DOM architecture that enables incremental rendering and interruptible work", "A CSS-in-JS library for styling React components", "A lightweight alternative to React Native for IoT devices", "The React 18 HTTP streaming protocol"],
            ans: 0,
            explanation: "React Fiber is the reimplementation of React's core algorithm, enabling features like concurrent rendering, scheduling, and prioritization."
        }
    ],

    "fastapi": [
        {
            q: "What library does FastAPI rely on for data validation, serialization, and schema definition?",
            options: ["Pydantic", "Marshmallow", "Cerberus", "Django Forms"],
            ans: 0,
            explanation: "FastAPI is built tightly on Pydantic for request validation, response serialization, and OpenAPI documentation."
        },
        {
            q: "Which ASGI framework does FastAPI use for high-performance routing and HTTP handling under the hood?",
            options: ["Starlette", "Flask", "Tornado", "Sanic"],
            ans: 0,
            explanation: "FastAPI extends Starlette directly for web routing, middleware, WebSockets, and background tasks."
        },
        {
            q: "How do you declare dependency injection in a FastAPI route handler function?",
            options: ["Using the `Depends()` helper in the route parameter signature", "Using the `@inject` decorator above the endpoint", "Configuring dependencies in a global settings.json file", "Importing dependencies inside the function body"],
            ans: 0,
            explanation: "FastAPI uses `param_name: Type = Depends(dependency_fn)` in the route handler arguments to declare dependencies."
        },
        {
            q: "What documentation interfaces does FastAPI automatically generate out of the box?",
            options: ["Swagger UI (`/docs`) and ReDoc (`/redoc`)", "Postman Collections and GraphiQL", "GitBook and Markdown files", "Sphinx HTML documentation"],
            ans: 0,
            explanation: "FastAPI serves interactive OpenAPI documentation at `/docs` (Swagger UI) and `/redoc` (ReDoc) automatically."
        },
        {
            q: "How should long-running tasks like sending emails be scheduled from a FastAPI endpoint without blocking the response?",
            options: ["Using `BackgroundTasks.add_task(...)`", "Calling `time.sleep()` in an async thread", "Spawning a separate OS process with `subprocess.Popen`", "Holding the client connection open until task completion"],
            ans: 0,
            explanation: "FastAPI provides `BackgroundTasks` to queue functions to run after sending the HTTP response."
        },
        {
            q: "What is the difference between defining an endpoint with `def` vs `async def` in FastAPI?",
            options: ["`def` endpoints run in an external thread pool; `async def` endpoints run directly on the main event loop", "`def` endpoints cannot use Pydantic models", "`async def` endpoints are synchronous and block worker processes", "They are identical; FastAPI converts all functions to async"],
            ans: 0,
            explanation: "Standard `def` endpoints are executed in Starlette's threadpool so blocking I/O does not freeze the event loop, while `async def` functions run directly on the event loop."
        },
        {
            q: "How do you define path parameters with type validation in FastAPI?",
            options: ["`@app.get('/items/{item_id}') def get_item(item_id: int):`", "`@app.get('/items/<int:item_id>')`", "`@app.get('/items?item_id=int')`", "`@app.get('/items/{id}') def get_item(id): validate_int(id)`"],
            ans: 0,
            explanation: "FastAPI matches curly-brace `{item_id}` in the path template to Python type-annotated arguments in the handler."
        },
        {
            q: "What status code should a FastAPI endpoint return when a new resource is successfully created?",
            options: ["status.HTTP_201_CREATED (201)", "status.HTTP_200_OK (200)", "status.HTTP_204_NO_CONTENT (204)", "status.HTTP_202_ACCEPTED (202)"],
            ans: 0,
            explanation: "HTTP 201 Created is the standard REST status code for successful resource creation."
        },
        {
            q: "How do you define query parameters with a default value and validation constraints like `min_length` in FastAPI?",
            options: ["Using the `Query()` function (e.g. `q: Optional[str] = Query(None, min_length=3)`)", "Using `Header()` with validation attributes", "Using `Path()` validator inside function body", "Writing a custom middleware for every query parameter"],
            ans: 0,
            explanation: "`Query()` from `fastapi` allows setting default values, metadata, and validation parameters like regex, min_length, and max_length."
        },
        {
            q: "What middleware in FastAPI enables browsers on different origins to access the API?",
            options: ["CORSMiddleware", "TrustedHostMiddleware", "HTTPSRedirectMiddleware", "GZipMiddleware"],
            ans: 0,
            explanation: "`CORSMiddleware` configures Cross-Origin Resource Sharing headers (`Access-Control-Allow-Origin`, methods, headers) for client browsers."
        }
    ],

    "docker": [
        {
            q: "What is the difference between a Docker image and a Docker container?",
            options: ["An image is a read-only template containing instructions and application files; a container is a runnable, isolated instance of an image", "An image is a running instance; a container is the blueprint file", "Images run in production; containers only run in development", "There is no technical difference between them"],
            ans: 0,
            explanation: "An image is an immutable snapshot with layers; a container adds a read-write layer on top and executes as an isolated process."
        },
        {
            q: "What is the benefit of a multi-stage Dockerfile build?",
            options: ["Separating the build environment from the runtime environment to significantly decrease final image size and attack surface", "Compiling for multiple operating system architectures simultaneously", "Running automated unit tests in parallel during docker compose up", "Creating multiple containers from a single docker run command"],
            ans: 0,
            explanation: "Multi-stage builds allow compiling assets or code in an intermediary stage and copying only the resulting binaries into a minimal production image."
        },
        {
            q: "How do `CMD` and `ENTRYPOINT` instructions interact in a Dockerfile?",
            options: ["`ENTRYPOINT` specifies the executable to run, while `CMD` provides default arguments that can be overridden from the command line", "`CMD` always overrides `ENTRYPOINT`", "`ENTRYPOINT` is only executed when building the image", "`CMD` is deprecated in Docker 20+"],
            ans: 0,
            explanation: "`ENTRYPOINT` sets the default container binary, while `CMD` provides default parameters that can be overridden when running `docker run <image> [args]`."
        },
        {
            q: "What type of Docker storage persists data on the host filesystem independently of the container lifecycle and is managed directly by Docker?",
            options: ["Docker Volumes (`docker volume create`)", "Bind mounts", "tmpfs mounts", "UnionFS writable layer"],
            ans: 0,
            explanation: "Named Docker volumes are managed by Docker inside `/var/lib/docker/volumes` and persist data even if containers are deleted."
        },
        {
            q: "Which Docker command removes all stopped containers, unused networks, and dangling images at once?",
            options: ["docker system prune", "docker container kill --all", "docker clean -f", "docker rmi --all"],
            ans: 0,
            explanation: "`docker system prune` cleans up stopped containers, dangling images, build cache, and unused networks."
        },
        {
            q: "What does the `HEALTHCHECK` instruction in a Dockerfile do?",
            options: ["Tells Docker how to test a container to check that it is still working properly", "Automatically restarts the container if memory exceeds 90%", "Scans the container layers for known CVE vulnerabilities", "Monitors the host system's CPU and disk space"],
            ans: 0,
            explanation: "The `HEALTHCHECK` instruction periodically runs a command (like `curl -f http://localhost/`) inside the container to report its health status."
        },
        {
            q: "Why should you order Dockerfile instructions from least-frequently-changing to most-frequently-changing?",
            options: ["To maximize Docker build cache reuse and speed up subsequent build times", "To reduce network bandwidth when pulling base images", "Because Docker executes instructions in reverse order", "To prevent file permissions from being overwritten"],
            ans: 0,
            explanation: "When a layer changes in a Dockerfile, all subsequent cached layers are invalidated. Placing dependencies (like `package.json` or `requirements.txt`) before application code maximizes caching."
        },
        {
            q: "What is the default network driver for standalone containers in Docker?",
            options: ["bridge", "host", "overlay", "macvlan"],
            ans: 0,
            explanation: "The default network driver is `bridge`, which creates a private internal network on the host with NAT."
        },
        {
            q: "What security best practice should be applied regarding user privileges in production Dockerfiles?",
            options: ["Specify a non-root `USER` instruction so the container does not run as root", "Always run containers with `--privileged`", "Grant containers access to `/var/run/docker.sock`", "Disable Linux namespaces for better isolation"],
            ans: 0,
            explanation: "Running containers as non-root users (`USER appuser`) mitigates container escape vulnerabilities and limits damage if compromised."
        },
        {
            q: "What file allows excluding sensitive files like `.env`, `node_modules`, and `.git` from being sent in the Docker build context?",
            options: [".dockerignore", ".env.docker", "docker-compose.ignore", "Dockerfile.exclude"],
            ans: 0,
            explanation: "The `.dockerignore` file prevents sensitive or bulky files from being uploaded to the Docker daemon during `docker build`."
        }
    ],

    "postgresql": [
        {
            q: "What type of index is created by default when defining a primary key or unique constraint in PostgreSQL?",
            options: ["B-Tree index", "Hash index", "GIN index", "BRIN index"],
            ans: 0,
            explanation: "PostgreSQL defaults to standard balanced B-Tree indexes for primary keys, unique constraints, and standard `CREATE INDEX` statements."
        },
        {
            q: "What command in PostgreSQL allows you to inspect the execution plan and actual execution timings of a query?",
            options: ["EXPLAIN ANALYZE", "INSPECT QUERY", "PROFILE EXECUTION", "DESCRIBE PLAN"],
            ans: 0,
            explanation: "`EXPLAIN ANALYZE` executes the query and prints the cost estimates, actual execution time, scan types, and node tree."
        },
        {
            q: "What does ACID stand for in the context of relational database management systems?",
            options: ["Atomicity, Consistency, Isolation, Durability", "Automated, Concurrent, Indexed, Distributed", "Authentication, Compression, Integrity, Duplication", "Access, Control, Inheritance, Decoupling"],
            ans: 0,
            explanation: "ACID guarantees that database transactions are processed reliably across failures."
        },
        {
            q: "Which PostgreSQL index type is optimal for indexing full-text search vectors and JSONB arrays?",
            options: ["GIN (Generalized Inverted Index)", "B-Tree", "BRIN (Block Range Index)", "SP-GiST"],
            ans: 0,
            explanation: "GIN indexes are designed for composite values where elements need to be looked up efficiently, like JSONB arrays and tsvector full-text search."
        },
        {
            q: "What is the purpose of the `VACUUM` command in PostgreSQL?",
            options: ["Reclaiming storage occupied by dead tuples from UPDATE and DELETE operations and updating statistics", "Deleting all corrupted database tables", "Backing up table schemas to cold storage", "Re-indexing all foreign keys in memory"],
            ans: 0,
            explanation: "PostgreSQL uses MVCC, which leaves old row versions (dead tuples) on updates/deletes. `VACUUM` cleans these up and reclaims space."
        },
        {
            q: "What is the difference between `DELETE FROM users` and `TRUNCATE TABLE users`?",
            options: ["`TRUNCATE` quickly empties the table by deallocating pages and skips row-by-row scans, while `DELETE` logs individual row deletions", "`DELETE` is faster than `TRUNCATE`", "`TRUNCATE` cannot be rolled back inside a transaction", "`DELETE` resets auto-incrementing identity sequences, whereas `TRUNCATE` does not"],
            ans: 0,
            explanation: "`TRUNCATE` is a DDL operation that drops storage pages directly without scanning rows, making it substantially faster for large tables."
        },
        {
            q: "What SQL clause allows evaluating aggregations over subsets of rows without collapsing them like `GROUP BY` does?",
            options: ["OVER (PARTITION BY ...)", "HAVING ALL (...)", "DISTRIBUTE BY (...)", "AGGREGATE THROUGH (...)"],
            ans: 0,
            explanation: "Window functions use the `OVER (PARTITION BY ... ORDER BY ...)` clause to compute moving averages, ranks, and sums without reducing rows."
        },
        {
            q: "Which join type returns all records from the left table and matched records from the right table, filling with NULL when no match exists?",
            options: ["LEFT JOIN (LEFT OUTER JOIN)", "INNER JOIN", "CROSS JOIN", "RIGHT JOIN"],
            ans: 0,
            explanation: "A LEFT JOIN preserves every row from the left table regardless of whether the join predicate matches rows in the right table."
        },
        {
            q: "What is a Common Table Expression (CTE) in SQL?",
            options: ["A temporary named result set defined using the `WITH` clause that exists only within the execution of a statement", "A permanent materialized view saved to disk", "A trigger that validates incoming column constraints", "A table partitioned across foreign servers"],
            ans: 0,
            explanation: "CTEs are defined with `WITH cte_name AS (...)` to create readable, modular, and optionally recursive query structures."
        },
        {
            q: "What does the `ON CONFLICT DO UPDATE` clause in PostgreSQL enable?",
            options: ["An Upsert operation (inserting a row or updating it if a unique constraint is violated)", "Auto-resolving foreign key cascading failures", "Preventing deadlock errors in concurrent transactions", "Merging table schemas during migrations"],
            ans: 0,
            explanation: "`INSERT ... ON CONFLICT (...) DO UPDATE` is PostgreSQL's native atomic upsert mechanism."
        }
    ],

    "general": [
        {
            q: "What is the primary benefit of the Model-View-Controller (MVC) architectural pattern?",
            options: ["Separation of concerns between business logic, user interface, and application routing", "Eliminating all database queries", "Automatically scaling servers in response to traffic", "Replacing client-side JavaScript frameworks"],
            ans: 0,
            explanation: "MVC isolates application data (Model), presentation layer (View), and input handling (Controller) to improve maintainability and testability."
        },
        {
            q: "Which data structure operates on a Last-In, First-Out (LIFO) basis?",
            options: ["Stack", "Queue", "Binary Search Tree", "Linked List"],
            ans: 0,
            explanation: "A Stack pushes and pops elements in LIFO order, like a stack of plates."
        },
        {
            q: "In RESTful API design, which HTTP method is expected to be idempotent and used for complete replacement of a resource?",
            options: ["PUT", "POST", "PATCH", "CONNECT"],
            ans: 0,
            explanation: "`PUT` is defined as idempotent (multiple identical requests have the same effect as a single request) and replaces the target entity."
        },
        {
            q: "What does DNS stand for in networking?",
            options: ["Domain Name System", "Dynamic Network Server", "Distributed Network Service", "Direct Node Switching"],
            ans: 0,
            explanation: "DNS (Domain Name System) maps human-readable domain names (e.g. skillbridge.com) into numerical IP addresses."
        },
        {
            q: "What is the time complexity of searching for an item in a balanced Binary Search Tree containing N items?",
            options: ["O(log N)", "O(1)", "O(N)", "O(N^2)"],
            ans: 0,
            explanation: "In a balanced BST, each comparison eliminates half the remaining search space, yielding O(log N) lookup time."
        },
        {
            q: "What is Cross-Site Scripting (XSS)?",
            options: ["A security vulnerability where malicious scripts are injected into trusted web applications and executed in victims' browsers", "An attack where malicious SQL queries manipulate database tables", "Flooding a server with forged HTTP requests to cause downtime", "Intercepting Wi-Fi packets between a router and client"],
            ans: 0,
            explanation: "XSS occurs when untrusted input is included in web pages without proper sanitization or encoding, executing malicious JavaScript in users' sessions."
        },
        {
            q: "What is the primary function of a reverse proxy like NGINX or Traefik?",
            options: ["Retrieving resources on behalf of a client from one or more backend servers and providing load balancing, SSL termination, and caching", "Compiling client-side TypeScript into minified bundles", "Managing database migrations across clusters", "Storing user session cookies securely"],
            ans: 0,
            explanation: "A reverse proxy fronts internal web services to handle SSL termination, load balancing, security firewalls, and static file caching."
        },
        {
            q: "Which of the following describes the Single Responsibility Principle (SRP) in SOLID software design?",
            options: ["A module or class should have one, and only one, reason to change", "A software entity should be open for extension but closed for modification", "Subtypes must be substitutable for their base types", "High-level modules should not depend on low-level modules"],
            ans: 0,
            explanation: "Robert C. Martin's Single Responsibility Principle states that a class or module should encapsulate a single aspect of functionality and have only one reason to change."
        },
        {
            q: "What does the CAP theorem state regarding distributed data stores?",
            options: ["A distributed system can guarantee at most two out of Consistency, Availability, and Partition Tolerance simultaneously", "All queries must complete within constant time", "Concurrency, Authentication, and Performance are mutually exclusive", "Partitioning always leads to data loss"],
            ans: 0,
            explanation: "The CAP theorem proves that in the event of a network partition (P), a distributed system must choose between Consistency (C) and Availability (A)."
        },
        {
            q: "What cryptographic hashing algorithm is recommended for securely storing user passwords with salting and work factor iteration?",
            options: ["bcrypt or Argon2", "MD5", "SHA-1", "Base64"],
            ans: 0,
            explanation: "bcrypt and Argon2 are computationally slow, memory-hard key derivation functions specifically designed to thwart brute-force GPU cracking."
        }
    ]
};

// Aliases mapping varied names to question bank keys
const SKILL_ALIASES = {
    "py": "python",
    "python3": "python",
    "js": "javascript",
    "es6": "javascript",
    "ts": "typescript",
    "reactjs": "react",
    "react.js": "react",
    "vue": "javascript",
    "vue.js": "javascript",
    "node": "javascript",
    "nodejs": "javascript",
    "node.js": "javascript",
    "fastapi": "fastapi",
    "django": "python",
    "docker": "docker",
    "container": "docker",
    "containers": "docker",
    "k8s": "docker",
    "kubernetes": "docker",
    "sql": "postgresql",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "psql": "postgresql",
    "database": "postgresql",
    "databases": "postgresql",
    "mongodb": "general",
    "mongo": "general",
    "redis": "general",
    "aws": "docker",
    "ci/cd": "docker",
    "cicd": "docker",
    "git": "general",
    "golang": "general",
    "go": "general",
    "java": "general",
    "aws": "general",
    "k8s": "general",
    "kubernetes": "general"
};

/**
 * Shuffles an array in place using modern Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Retrieves exactly `count` (default 10) random questions for the specified skill.
 * Also shuffles question options and updates correct answer index.
 */
function getSkillQuizQuestions(skillName, count = 10) {
    const normalized = (skillName || "").trim().toLowerCase();
    const key = SKILL_ALIASES[normalized] || (SKILL_QUESTION_BANKS[normalized] ? normalized : "general");
    
    let rawBank = SKILL_QUESTION_BANKS[key] || SKILL_QUESTION_BANKS["general"];
    
    // If bank has fewer than count questions, supplement with general questions
    let combinedPool = [...rawBank];
    if (combinedPool.length < count && key !== "general") {
        combinedPool = combinedPool.concat(SKILL_QUESTION_BANKS["general"]);
    }

    // Shuffle and pick 10 distinct questions
    const selectedQuestions = shuffleArray(combinedPool).slice(0, count);

    // Shuffle options for each question so answers are randomized across attempts
    return selectedQuestions.map((qObj, index) => {
        const originalOptions = qObj.options;
        const correctAnswerText = originalOptions[qObj.ans];
        
        // Shuffle options
        const shuffledOptions = shuffleArray(originalOptions);
        const newAnsIndex = shuffledOptions.indexOf(correctAnswerText);

        return {
            id: index + 1,
            q: qObj.q,
            options: shuffledOptions,
            ans: newAnsIndex,
            explanation: qObj.explanation || ""
        };
    });
}

// Attach to window for global access
if (typeof window !== 'undefined') {
    window.QuizBank = {
        getSkillQuizQuestions,
        SKILL_QUESTION_BANKS
    };
}
