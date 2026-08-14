"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/AdminLayout";

type TaskStatus = "PENDING" | "DONE" | "CLOSED";

interface EventItem {
  id: string;
  title: string;
  createdById?: string | number;
}

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  deadline?: string | null;
  status: TaskStatus;
  eventId: string;
  createdById?: string | number;
  assignedToId?: string | number | null;
  assigneeId?: string | number | null;
  assignedUserId?: string | number | null;
  assignedTo?: {
    id?: string | number;
    fullName?: string;
    name?: string;
  } | null;
}

interface CurrentUser {
  id?: string | number;
  userId?: string | number;
  sub?: string | number;
  role?: string;
  userRole?: string;
}

const API_BASES = ["http://localhost:3000", "http://localhost:3002"];

const buildApiCandidates = (paths: string[]) => {
  const urls: string[] = [];
  for (const base of API_BASES) {
    for (const path of paths) {
      urls.push(`${base}${path}`);
    }
  }
  return urls;
};

const getUserId = (user: CurrentUser | null) => {
  if (!user) {
    return "";
  }
  const id = user.id ?? user.userId ?? user.sub;
  return id === undefined || id === null ? "" : String(id);
};

const getRole = (user: CurrentUser | null) =>
  (user?.role || user?.userRole || "").toString().toUpperCase();

const parseTaskStatus = (value: unknown): TaskStatus => {
  const status = String(value || "PENDING").toUpperCase();
  if (status === "DONE" || status === "CLOSED") {
    return status;
  }
  return "PENDING";
};

const normalizeTasks = (payload: unknown): TaskItem[] => {
  const records = Array.isArray(payload)
    ? payload
    : payload &&
        typeof payload === "object" &&
        Array.isArray((payload as any).data)
      ? (payload as any).data
      : [];

  return records
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const record = item as any;
      const id = record.id ? String(record.id) : "";
      const eventId = record.eventId
        ? String(record.eventId)
        : record.event_id
          ? String(record.event_id)
          : "";

      if (!id || !eventId) {
        return null;
      }

      return {
        id,
        title: String(record.title || "Untitled task"),
        description:
          record.description === undefined || record.description === null
            ? null
            : String(record.description),
        deadline:
          record.deadline === undefined || record.deadline === null
            ? null
            : String(record.deadline),
        status: parseTaskStatus(record.status),
        eventId,
        createdById: record.createdById ?? record.created_by_id,
        assignedToId: record.assignedToId ?? record.assigned_to_id ?? null,
        assigneeId: record.assigneeId ?? null,
        assignedUserId: record.assignedUserId ?? null,
        assignedTo:
          record.assignedTo && typeof record.assignedTo === "object"
            ? record.assignedTo
            : null,
      } satisfies TaskItem;
    })
    .filter((task): task is TaskItem => !!task);
};

const normalizeEvents = (payload: unknown): EventItem[] => {
  const records = Array.isArray(payload)
    ? payload
    : payload &&
        typeof payload === "object" &&
        Array.isArray((payload as any).data)
      ? (payload as any).data
      : [];

  return records
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const record = item as any;
      const id = record.id ? String(record.id) : "";
      if (!id) {
        return null;
      }
      return {
        id,
        title: String(record.title || "Untitled event"),
        createdById: record.createdById ?? record.created_by_id,
      } satisfies EventItem;
    })
    .filter((event): event is EventItem => !!event);
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "No deadline";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

export default function VolunteerTasksPage() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingTaskId, setActionLoadingTaskId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | TaskStatus>("ALL");
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("ALL");

  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("authToken") ||
      "";
    const rawUser = localStorage.getItem("user");

    if (!token || !rawUser) {
      router.push(`/login?next=${encodeURIComponent("/organizer/tasks")}`);
      return;
    }

    try {
      const user = JSON.parse(rawUser) as CurrentUser;
      const role = getRole(user);
      if (role !== "VOLUNTEER") {
        router.push(role === "MEMBER" ? "/member" : "/dashbord");
        return;
      }
      setCurrentUser(user);
      setAuthToken(token);
    } catch (parseError) {
      console.error("Failed to parse user from localStorage:", parseError);
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!authToken) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const headers: HeadersInit = { Authorization: `Bearer ${authToken}` };

        const eventUrls = buildApiCandidates(["/event", "/events"]);
        let loadedEvents: EventItem[] = [];
        for (const url of eventUrls) {
          const res = await fetch(url, { headers });
          if (!res.ok) {
            continue;
          }
          loadedEvents = normalizeEvents(await res.json());
          break;
        }

        const taskUrls = buildApiCandidates(["/tasks", "/task"]);
        let loadedTasks: TaskItem[] = [];
        for (const url of taskUrls) {
          const res = await fetch(url, { headers });
          if (!res.ok) {
            continue;
          }
          loadedTasks = normalizeTasks(await res.json());
          break;
        }

        if (loadedTasks.length === 0) {
          throw new Error(
            "Could not load tasks. Please verify backend task endpoints.",
          );
        }

        const eventIdSet = new Set(loadedEvents.map((event) => event.id));
        const adminEventTasks =
          eventIdSet.size > 0
            ? loadedTasks.filter((task) => eventIdSet.has(task.eventId))
            : loadedTasks;

        setEvents(loadedEvents);
        setTasks(adminEventTasks);
      } catch (fetchError: any) {
        console.error("Failed to load volunteer tasks:", fetchError);
        setError(fetchError?.message || "Failed to load volunteer tasks.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authToken]);

  const currentUserId = getUserId(currentUser);
  const eventMap = useMemo(() => {
    const map = new Map<string, EventItem>();
    for (const event of events) {
      map.set(event.id, event);
    }
    return map;
  }, [events]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tasks.filter((task) => {
      if (statusFilter !== "ALL" && task.status !== statusFilter) {
        return false;
      }

      if (eventFilter !== "ALL" && task.eventId !== eventFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const eventTitle = eventMap.get(task.eventId)?.title || "";
      const blob =
        `${task.title} ${task.description || ""} ${eventTitle}`.toLowerCase();
      return blob.includes(normalizedSearch);
    });
  }, [tasks, statusFilter, eventFilter, search, eventMap]);

  const summary = useMemo(() => {
    const base = { total: 0, pending: 0, done: 0, closed: 0, mine: 0 };
    for (const task of tasks) {
      base.total += 1;
      if (task.status === "PENDING") base.pending += 1;
      if (task.status === "DONE") base.done += 1;
      if (task.status === "CLOSED") base.closed += 1;
      if (isTaskAssignedToUser(task, currentUserId)) base.mine += 1;
    }
    return base;
  }, [tasks, currentUserId]);

  const assignTask = async (task: TaskItem) => {
    if (!authToken || !currentUserId) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setActionLoadingTaskId(task.id);
    setError(null);

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      };

      const payloads = [
        { userId: currentUserId },
        { assignedToId: currentUserId },
        { assigneeId: currentUserId },
        { assignedUserId: currentUserId },
      ];

      const endpoints = buildApiCandidates([
        `/tasks/${task.id}/assign`,
        `/task/${task.id}/assign`,
        `/tasks/assign/${task.id}`,
        `/task/assign/${task.id}`,
        `/tasks/${task.id}`,
        `/task/${task.id}`,
      ]);

      let success = false;
      for (const endpoint of endpoints) {
        const methods = endpoint.endsWith(`/${task.id}`)
          ? ["PATCH", "PUT"]
          : ["POST", "PATCH", "PUT"];

        for (const method of methods) {
          for (const payload of payloads) {
            const res = await fetch(endpoint, {
              method,
              headers,
              body: JSON.stringify(payload),
            });

            if (res.ok) {
              success = true;
              break;
            }

            if (res.status === 401 || res.status === 403) {
              throw new Error("You are not allowed to assign this task.");
            }
          }

          if (success) {
            break;
          }
        }

        if (success) {
          break;
        }
      }

      if (!success) {
        throw new Error(
          "Task assignment endpoint was not found on the server.",
        );
      }

      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? {
                ...item,
                assignedToId: currentUserId,
                assigneeId: currentUserId,
                assignedUserId: currentUserId,
              }
            : item,
        ),
      );
    } catch (assignError: any) {
      setError(assignError?.message || "Failed to assign task.");
    } finally {
      setActionLoadingTaskId(null);
    }
  };

  const unassignTask = async (task: TaskItem) => {
    if (!authToken) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setActionLoadingTaskId(task.id);
    setError(null);

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      };

      const payloads = [
        { userId: null },
        { assignedToId: null },
        { assigneeId: null },
        { assignedUserId: null },
      ];

      const endpoints = buildApiCandidates([
        `/tasks/${task.id}/unassign`,
        `/task/${task.id}/unassign`,
        `/tasks/unassign/${task.id}`,
        `/task/unassign/${task.id}`,
        `/tasks/${task.id}`,
        `/task/${task.id}`,
      ]);

      let success = false;
      for (const endpoint of endpoints) {
        const methods = endpoint.endsWith(`/${task.id}`)
          ? ["PATCH", "PUT"]
          : ["POST", "PATCH", "PUT"];

        for (const method of methods) {
          for (const payload of payloads) {
            const res = await fetch(endpoint, {
              method,
              headers,
              body: JSON.stringify(payload),
            });

            if (res.ok) {
              success = true;
              break;
            }

            if (res.status === 401 || res.status === 403) {
              throw new Error("You are not allowed to unassign this task.");
            }
          }

          if (success) {
            break;
          }
        }

        if (success) {
          break;
        }
      }

      if (!success) {
        throw new Error("Task unassign endpoint was not found on the server.");
      }

      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? {
                ...item,
                assignedToId: null,
                assigneeId: null,
                assignedUserId: null,
              }
            : item,
        ),
      );
    } catch (unassignError: any) {
      setError(unassignError?.message || "Failed to unassign task.");
    } finally {
      setActionLoadingTaskId(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Volunteer Tasks">
        <div className="min-h-full flex items-center justify-center bg-gray-50">
          <p className="text-gray-500 font-medium">
            Loading volunteer tasks...
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Volunteer Tasks">
      <div className="min-h-full bg-[#f3f4f6] p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="rounded-3xl border border-teal-100 bg-linear-to-r from-teal-50 via-white to-cyan-50 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] font-bold text-teal-600">
              Tasks
            </p>
            <h1 className="mt-2 text-4xl font-extrabold text-slate-900">
              Volunteer Task Command Center
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-3xl">
              See admin-created event tasks, claim what you can execute, and
              keep assignments moving in real time.
            </p>

            <div className="mt-5 grid grid-cols-2 lg:grid-cols-5 gap-3">
              <MetricCard label="Total" value={summary.total} tone="slate" />
              <MetricCard
                label="Pending"
                value={summary.pending}
                tone="amber"
              />
              <MetricCard label="Done" value={summary.done} tone="emerald" />
              <MetricCard label="Closed" value={summary.closed} tone="rose" />
              <MetricCard
                label="Assigned To Me"
                value={summary.mine}
                tone="sky"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search task title, description, event..."
                className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />

              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="ALL">All events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "ALL" | TaskStatus)
                }
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="ALL">All status</option>
                <option value="PENDING">Pending</option>
                <option value="DONE">Done</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredTasks.length === 0 ? (
              <div className="lg:col-span-2 rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center">
                <p className="text-lg font-semibold text-gray-700">
                  No tasks match your filters.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Try changing status or event selection.
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const event = eventMap.get(task.eventId);
                const mine = isTaskAssignedToUser(task, currentUserId);

                return (
                  <article
                    key={task.id}
                    className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                      {task.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 min-h-10">
                      {task.description?.trim() || "No additional description."}
                    </p>

                    <div className="mt-4 space-y-1.5 text-sm text-gray-500">
                      <p>
                        <span className="font-semibold text-gray-600">
                          Event:
                        </span>{" "}
                        {event?.title || task.eventId}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-600">
                          Event ID:
                        </span>{" "}
                        {task.eventId}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-600">
                          Created by:
                        </span>{" "}
                        {task.createdById ? String(task.createdById) : "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-600">
                          Deadline:
                        </span>{" "}
                        {formatDateTime(task.deadline)}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2.5">
                      <div className={statusClassName(task.status)}>
                        Status: {task.status}
                      </div>

                      {mine ? (
                        <button
                          type="button"
                          onClick={() => unassignTask(task)}
                          disabled={actionLoadingTaskId === task.id}
                          className="rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-70"
                        >
                          {actionLoadingTaskId === task.id
                            ? "Working..."
                            : "Unassign myself"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => assignTask(task)}
                          disabled={actionLoadingTaskId === task.id}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-70"
                        >
                          {actionLoadingTaskId === task.id
                            ? "Working..."
                            : "Assign to me"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Need ticket scanning too?
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Switch between task assignment and QR check-in as part of the
                same volunteer workflow.
              </p>
            </div>
            <Link
              href="/organizer/scan"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Open Ticket Scanner
            </Link>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

function isTaskAssignedToUser(task: TaskItem, userId: string) {
  if (!userId) {
    return false;
  }

  const candidateIds = [
    task.assignedToId,
    task.assigneeId,
    task.assignedUserId,
    task.assignedTo?.id,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value));

  return candidateIds.includes(userId);
}

function statusClassName(status: TaskStatus) {
  if (status === "DONE") {
    return "rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-center text-sm font-bold text-emerald-700";
  }
  if (status === "CLOSED") {
    return "rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-center text-sm font-bold text-slate-700";
  }
  return "rounded-xl border border-amber-200 bg-amber-100 py-2.5 text-center text-sm font-bold text-amber-700";
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "amber" | "emerald" | "rose" | "sky";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "rose"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : tone === "sky"
            ? "border-sky-200 bg-sky-50 text-sky-700"
            : "border-slate-200 bg-white text-slate-700";

  return (
    <article className={`rounded-xl border px-4 py-3 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.14em] font-bold">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </article>
  );
}
