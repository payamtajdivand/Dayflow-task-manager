import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "dayflow-data-v1";
const THEME_KEY = "dayflow-theme-mode";

const priorityStyles = {
  Low: "bg-ink-200 text-ink-900",
  Medium: "bg-sunrise-400 text-ink-900",
  High: "bg-dusk-400 text-white",
};

const emptySeed = () => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(today.getDate() + 2);
  return {
    selectedDate: toDateKey(today),
    tasks: [
      {
        id: createId(),
        title: "Prep weekly review",
        date: toDateKey(today),
        done: false,
        priority: "High",
        tag: "Planning",
        time: "09:30",
      },
      {
        id: createId(),
        title: "Design sprint kickoff",
        date: toDateKey(today),
        done: false,
        priority: "Medium",
        tag: "Team",
        time: "13:00",
      },
      {
        id: createId(),
        title: "Refactor calendar component",
        date: toDateKey(tomorrow),
        done: false,
        priority: "Low",
        tag: "Dev",
        time: "15:00",
      },
      {
        id: createId(),
        title: "Plan deep work block",
        date: toDateKey(dayAfter),
        done: false,
        priority: "Medium",
        tag: "Focus",
        time: "10:00",
      },
    ],
    plans: {
      [toDateKey(today)]:
        `# Today\n- Top outcomes\n- Key meetings\n- Personal energy check\n\n## Notes\n*Reminder:* protect the morning deep-work block.\n`,
    },
  };
};

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(16).slice(2)}`;
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getMonthMatrix(viewDate) {
  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const startDay = (start.getDay() + 6) % 7;
  const daysInMonth = end.getDate();
  const cells = [];
  for (let i = 0; i < startDay; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
  }
  return cells;
}

function formatLongDate(key) {
  return parseDateKey(key).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function markdownToHtml(markdown) {
  const escape = (value) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = escape(markdown).split("\n");
  const html = [];
  let inList = false;
  lines.forEach((line) => {
    const listMatch = line.match(/^\s*[-*]\s+(.*)/);
    if (listMatch) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(listMatch[1])}</li>`);
      return;
    }
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
    if (line.startsWith("### ")) {
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
      return;
    }
    if (line.startsWith("## ")) {
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
      return;
    }
    if (line.startsWith("# ")) {
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
      return;
    }
    if (line.trim() === "") {
      html.push("<br />");
      return;
    }
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  });
  if (inList) {
    html.push("</ul>");
  }
  return html.join("");
}

function inlineMarkdown(text) {
  let value = text;
  value = value.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  value = value.replace(/\*(.*?)\*/g, "<em>$1</em>");
  value = value.replace(/`(.*?)`/g, "<code>$1</code>");
  return value;
}

export default function App() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("All");
  const [viewDate, setViewDate] = useState(new Date());
  const [planMode, setPlanMode] = useState("Edit");
  const [themeMode, setThemeMode] = useState("system");
  const [theme, setTheme] = useState("light");
  const [form, setForm] = useState({
    title: "",
    time: "",
    priority: "Medium",
    tag: "",
    date: toDateKey(new Date()),
  });

  useEffect(() => {
    const storedThemeMode = localStorage.getItem(THEME_KEY);
    if (storedThemeMode === "light" || storedThemeMode === "dark") {
      setThemeMode(storedThemeMode);
      setTheme(storedThemeMode);
    } else {
      setThemeMode("system");
      setTheme(getSystemTheme());
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData(parsed);
        setForm((prev) => ({
          ...prev,
          date: parsed.selectedDate || prev.date,
        }));
        setViewDate(parseDateKey(parsed.selectedDate || toDateKey(new Date())));
        return;
      } catch (error) {
        console.warn("Failed to parse stored data", error);
      }
    }
    const seed = emptySeed();
    setData(seed);
    setForm((prev) => ({ ...prev, date: seed.selectedDate }));
    setViewDate(parseDateKey(seed.selectedDate));
  }, []);

  useEffect(() => {
    if (themeMode === "system") {
      setTheme(getSystemTheme());
    } else {
      setTheme(themeMode);
    }
  }, [themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (themeMode === "system") {
        setTheme(getSystemTheme());
      }
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [themeMode]);

  useEffect(() => {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  const selectedDate = data?.selectedDate || toDateKey(new Date());
  const tasks = data?.tasks || [];
  const plans = data?.plans || {};

  const tasksForSelected = useMemo(() => {
    const filtered = tasks.filter((task) => task.date === selectedDate);
    if (filter === "Active") return filtered.filter((task) => !task.done);
    if (filter === "Done") return filtered.filter((task) => task.done);
    return filtered;
  }, [tasks, selectedDate, filter]);

  const completionRate = useMemo(() => {
    const todayTasks = tasks.filter((task) => task.date === selectedDate);
    if (todayTasks.length === 0) return 0;
    const doneCount = todayTasks.filter((task) => task.done).length;
    return Math.round((doneCount / todayTasks.length) * 100);
  }, [tasks, selectedDate]);

  const upcoming = useMemo(() => {
    const current = parseDateKey(selectedDate);
    const upcomingTasks = tasks
      .filter((task) => parseDateKey(task.date) >= current && !task.done)
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(0, 4);
    return upcomingTasks;
  }, [tasks, selectedDate]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.done).length;
    const todayCount = tasks.filter(
      (task) => task.date === selectedDate,
    ).length;
    return { total, done, todayCount };
  }, [tasks, selectedDate]);

  const monthCells = useMemo(() => getMonthMatrix(viewDate), [viewDate]);

  const taskCountByDate = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      map[task.date] = (map[task.date] || 0) + 1;
    });
    return map;
  }, [tasks]);

  const planForSelected = plans[selectedDate] || "";

  const updateData = (updater) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      return next;
    });
  };

  const addTask = (event) => {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    updateData((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          id: createId(),
          title,
          date: form.date,
          done: false,
          priority: form.priority,
          tag: form.tag || "General",
          time: form.time,
        },
      ],
      selectedDate: form.date,
    }));
    setForm((prev) => ({ ...prev, title: "", time: "" }));
  };

  const toggleTask = (id) => {
    updateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    }));
  };

  const deleteTask = (id) => {
    updateData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== id),
    }));
  };

  const updateTaskField = (id, field, value) => {
    updateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === id ? { ...task, [field]: value } : task,
      ),
    }));
  };

  const setSelectedDate = (dateKey) => {
    updateData((prev) => ({
      ...prev,
      selectedDate: dateKey,
    }));
    setForm((prev) => ({ ...prev, date: dateKey }));
  };

  const updatePlan = (value) => {
    updateData((prev) => ({
      ...prev,
      plans: {
        ...prev.plans,
        [selectedDate]: value,
      },
    }));
  };

  const downloadPlan = () => {
    const blob = new Blob([planForSelected], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedDate}-plan.md`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const changeMonth = (offset) => {
    const next = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + offset,
      1,
    );
    setViewDate(next);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeMode(next);
    localStorage.setItem(THEME_KEY, next);
  };

  if (!data) return null;

  return (
    <div className="min-h-screen px-6 py-10 text-ink-900 dark:text-ink-200">
      <header className="mx-auto mb-8 flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-ink-700 dark:text-white">
            Dayflow
          </p>
          <h1 className="font-display text-4xl sm:text-5xl dark:text-white">
            Task Manager Dashboard
          </h1>
          <p className="mt-2 text-ink-700 dark:text-white">
            {formatLongDate(selectedDate)} - {tasksForSelected.length} tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-full bg-ink-900 px-5 py-2 text-sm font-semibold text-white shadow-glow dark:bg-ink-200 dark:text-ink-900"
            onClick={() => setSelectedDate(toDateKey(new Date()))}
          >
            Jump to Today
          </button>
          <button
            className="rounded-full border border-ink-200 bg-white/80 p-2 text-sm dark:border-ink-700 dark:bg-ink-900/70"
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-ink-900 dark:text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M3 12h2M19 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-ink-900 dark:text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.7a8.5 8.5 0 1 1-9.7-9.7 7 7 0 0 0 9.7 9.7z" />
              </svg>
            )}
          </button>
          <div className="rounded-full border border-ink-200 bg-white/80 px-4 py-2 text-sm text-ink-900 dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200">
            {completionRate}% complete
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="grid gap-6">
          <div className="glass rounded-3xl p-6 shadow-glow">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl dark:text-white">
                  Daily To-Do
                </h2>
                <p className="text-sm text-ink-700 dark:text-white">
                  Create, prioritize, and schedule tasks.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/80 p-1 text-sm text-ink-900 dark:bg-ink-900/70 dark:text-ink-200">
                {["All", "Active", "Done"].map((value) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={`rounded-full px-3 py-1 font-medium transition ${
                      filter === value
                        ? "bg-ink-900 text-white dark:bg-ink-200 dark:text-ink-900"
                        : "text-ink-700 dark:text-ink-200"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <form
              className="mt-6 grid gap-3 rounded-2xl border border-ink-200 bg-white/80 p-4 text-ink-900 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200"
              onSubmit={addTask}
            >
              <input
                className="rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder-ink-700 dark:border-ink-200 dark:bg-ink-900/70 dark:text-ink-200 dark:placeholder-ink-400"
                placeholder="Task title"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
              />
              <input
                type="time"
                className="rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-900 dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200"
                value={form.time}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, time: event.target.value }))
                }
              />
              <select
                className="rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-900 dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200"
                value={form.priority}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, priority: event.target.value }))
                }
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <input
                className="rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder-ink-700 dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200 dark:placeholder-ink-400"
                placeholder="Tag"
                value={form.tag}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, tag: event.target.value }))
                }
              />
              <input
                type="date"
                className="rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-900 dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200"
                value={form.date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, date: event.target.value }))
                }
              />
              <button
                className="sm:col-span-5 rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white"
                type="submit"
              >
                Add task
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {tasksForSelected.length === 0 && (
                <div className="rounded-2xl border border-dashed border-ink-200 p-4 text-center text-sm text-ink-700">
                  No tasks yet. Add the first focus item for this day.
                </div>
              )}
              {tasksForSelected.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink-200 bg-white/90 px-4 py-3 text-ink-900 dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200"
                >
                  <button
                    className={`h-5 w-5 rounded-full border-2 ${
                      task.done ? "border-ink-900 bg-ink-900" : "border-ink-700"
                    }`}
                    onClick={() => toggleTask(task.id)}
                    aria-label="toggle task"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`font-medium ${
                          task.done
                            ? "text-ink-700 line-through"
                            : "text-ink-900 dark:text-white"
                        }`}
                      >
                        {task.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          priorityStyles[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="rounded-full bg-ink-200 px-2 py-0.5 text-xs text-ink-900 dark:text-white">
                        {task.tag}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-700 dark:text-ink-300">
                      <span>
                        {task.time ? `Time ${task.time}` : "No time set"}
                      </span>
                      <span>Due {task.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-900 dark:text-ink-200">
                    <input
                      type="date"
                      className="rounded-lg border border-ink-200 px-2 py-1 text-ink-900 dark:border-ink-600 dark:bg-ink-900/70 dark:text-ink-200"
                      value={task.date}
                      onChange={(event) =>
                        updateTaskField(task.id, "date", event.target.value)
                      }
                    />
                    <button
                      className="rounded-lg border border-ink-200 px-2 py-1 text-ink-900 dark:border-ink-600 dark:text-ink-200"
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-6 shadow-glow">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl dark:text-white">
                  Daily Plan (.md)
                </h2>
                <p className="text-sm text-ink-700 dark:text-white">
                  Write your day in Markdown and export it.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/80 p-1 text-sm text-ink-900 dark:bg-ink-900/70 dark:text-ink-200">
                {["Edit", "Preview"].map((value) => (
                  <button
                    key={value}
                    onClick={() => setPlanMode(value)}
                    className={`rounded-full px-3 py-1 font-medium transition ${
                      planMode === value
                        ? "bg-ink-900 text-white dark:bg-ink-200 dark:text-ink-900"
                        : "text-ink-700 dark:text-ink-200"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <textarea
                className="min-h-[220px] rounded-2xl border border-ink-200 bg-white/90 p-4 text-sm font-mono text-ink-900 dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200"
                value={planForSelected}
                onChange={(event) => updatePlan(event.target.value)}
              />
              <div className="rounded-2xl border border-ink-200 bg-white/90 p-4 text-sm text-ink-900 dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200">
                {planMode === "Preview" ? (
                  <div
                    className="markdown-preview space-y-2"
                    dangerouslySetInnerHTML={{
                      __html: markdownToHtml(planForSelected),
                    }}
                  />
                ) : (
                  <div className="text-ink-700 dark:text-ink-300">
                    Switch to Preview to see formatted Markdown.
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                className="rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white"
                onClick={downloadPlan}
              >
                Download .md
              </button>
              <span className="text-xs text-ink-700 dark:text-ink-300">
                Saved locally in your browser.
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          <div className="glass rounded-3xl p-6 shadow-glow">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl dark:text-white">
                  Calendar
                </h2>
                <p className="text-sm text-ink-700 dark:text-white">
                  Click a day to view its tasks.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full border border-ink-200 bg-white/80 px-3 py-1 font-medium text-ink-900 dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200">
                  {viewDate.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <button
                  className="rounded-full border border-ink-200 bg-white/80 px-3 py-1 text-ink-900 dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200"
                  onClick={() => changeMonth(-1)}
                >
                  Prev
                </button>
                <button
                  className="rounded-full border border-ink-200 bg-white/80 px-3 py-1 text-ink-900 dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200"
                  onClick={() => changeMonth(1)}
                >
                  Next
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2 text-xs uppercase text-ink-900 dark:text-white">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                (label) => (
                  <div key={label} className="text-center">
                    {label}
                  </div>
                ),
              )}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {monthCells.map((cell, index) => {
                if (!cell) {
                  return <div key={`empty-${index}`} />;
                }
                const key = toDateKey(cell);
                const isActive = key === selectedDate;
                const count = taskCountByDate[key] || 0;
                const hasPlan = Boolean(plans[key]);
                return (
                  <button
                    key={key}
                    className={`calendar-cell ${
                      isActive ? "active" : "bg-white/80 text-ink-900 dark:bg-ink-900/70 dark:text-ink-200"
                    }`}
                    onClick={() => setSelectedDate(key)}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`date-pill ${
                          isActive ? "date-pill-active" : "date-pill-inactive"
                        }`}
                      >
                        {cell.getDate()}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      {Array.from({ length: Math.min(count, 3) }).map(
                        (_, dotIndex) => (
                          <span
                            key={`${key}-dot-${dotIndex}`}
                            className="h-1.5 w-1.5 rounded-full bg-ink-900"
                          />
                        ),
                      )}
                      {count > 3 && (
                        <span className="text-[10px] text-ink-700">
                          +{count - 3}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-3xl p-6 shadow-glow grid-dots">
            <h2 className="font-display text-2xl dark:text-white">
              Dashboard Snapshot
            </h2>
            <p className="mt-1 text-sm text-ink-700 dark:text-white">
              Extra insights to keep momentum.
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-ink-200 bg-white/90 p-4 text-ink-900 dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-700 dark:text-ink-300">
                  Totals
                </p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span>Total tasks</span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span>Completed</span>
                  <span className="font-semibold">{stats.done}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span>Today</span>
                  <span className="font-semibold">{stats.todayCount}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-ink-200 bg-white/90 p-4 text-ink-900 dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-700 dark:text-ink-300">
                  Upcoming
                </p>
                <div className="mt-2 space-y-2 text-sm">
                  {upcoming.length === 0 && (
                    <p className="text-ink-700 dark:text-ink-300">No upcoming tasks.</p>
                  )}
                  {upcoming.map((task) => (
                    <div
                      key={`up-${task.id}`}
                      className="flex items-center justify-between"
                    >
                      <span>{task.title}</span>
                      <span className="text-xs text-ink-700 dark:text-ink-300">{task.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-ink-200 bg-white/90 p-4 text-ink-900 dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-700 dark:text-ink-300">
                  Focus Meter
                </p>
                <div className="mt-3 h-3 rounded-full bg-ink-200">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-sunrise-500 to-ocean-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-ink-700 dark:text-ink-300">
                  {completionRate}% of today complete
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
