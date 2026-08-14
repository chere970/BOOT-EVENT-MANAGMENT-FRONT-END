"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminLayout from "../components/AdminLayout";

type TimeRange = "7d" | "30d" | "month" | "all";

type Event = {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string | null;
  location?: string | null;
  attendeeCapacity?: number | string | null;
  createdAt?: string;
  registrations?: unknown[];
  registrationCount?: number | string;
  registrationsCount?: number | string;
  registeredCount?: number | string;
  attendeeCount?: number | string;
  totalRegistrations?: number | string;
  _count?: {
    registrations?: number | string;
  };
};

type TaskStatus = "PENDING" | "DONE" | "CLOSED";

type Task = {
  id: string;
  title: string;
  deadline?: string | null;
  status: TaskStatus;
  eventId?: string;
  eventTitle?: string;
};

type DashboardKpis = {
  totalEvents: number;
  totalRegistrations: number;
  avgFillRate: number;
  upcomingEvents: number;
  ongoingEvents: number;
  pastEvents: number;
  overdueTasks: number;
  taskCompletionRate: number;
};

type FetchFallbackResult = {
  ok: boolean;
  data: unknown;
  successfulUrl?: string;
};

const API_BASES = ["http://localhost:3000", "http://localhost:3002"];

const DATE_RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const loadDashboardData = useCallback(
    async (showBlockingLoader: boolean) => {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("authToken") ||
        "";

      if (!token) {
        router.push("/login");
        return;
      }

      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        try {
          const parsedUser = JSON.parse(rawUser);
          const activeRole = (parsedUser?.role || parsedUser?.userRole || "")
            .toString()
            .toUpperCase();
          if (activeRole === "MEMBER") {
            router.push("/member");
            return;
          }
        } catch (parseError) {
          console.error("Failed to parse user from localStorage:", parseError);
        }
      }

      if (showBlockingLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError("");
      setWarning("");

      try {
        const [eventResult, taskResult] = await Promise.all([
          fetchJsonWithFallback(
            token,
            buildApiCandidates(["/event", "/events"]),
          ),
          fetchJsonWithFallback(token, buildApiCandidates(["/task", "/tasks"])),
        ]);

        const normalizedEvents = normalizeEvents(eventResult.data);
        const enrichedEvents = await enrichEventsWithRegistrationCounts(
          normalizedEvents,
          token,
        );
        const normalizedTasks = normalizeTasks(taskResult.data);

        const unavailableSources: string[] = [];
        if (!eventResult.ok) {
          unavailableSources.push("events");
        }
        if (!taskResult.ok) {
          unavailableSources.push("tasks");
        }

        if (unavailableSources.length > 0) {
          setWarning(
            `Some dashboard sources are unavailable: ${unavailableSources.join(", ")}. Showing available data only.`,
          );
        }

        setEvents(enrichedEvents);
        setTasks(normalizedTasks);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router],
  );

  useEffect(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  const filteredEvents = useMemo(
    () => events.filter((event) => isEventWithinRange(event, timeRange)),
    [events, timeRange],
  );

  const filteredTasks = useMemo(
    () => tasks.filter((task) => isTaskWithinRange(task, timeRange)),
    [tasks, timeRange],
  );

  const eventStatusSummary = useMemo(() => {
    const now = new Date();
    const upcoming: Event[] = [];
    const ongoing: Event[] = [];
    const past: Event[] = [];

    for (const event of events) {
      const status = getEventLifecycleStatus(event, now);
      if (status === "UPCOMING") {
        upcoming.push(event);
      } else if (status === "ONGOING") {
        ongoing.push(event);
      } else if (status === "PAST") {
        past.push(event);
      }
    }

    upcoming.sort((a, b) => {
      const aDate =
        parseDate(a.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDate =
        parseDate(b.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });

    ongoing.sort((a, b) => {
      const aDate =
        parseDate(a.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDate =
        parseDate(b.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });

    return {
      upcoming,
      ongoing,
      past,
      upcomingCount: upcoming.length,
      ongoingCount: ongoing.length,
      pastCount: past.length,
    };
  }, [events]);

  const kpis = useMemo<DashboardKpis>(() => {
    const now = new Date();

    const totalRegistrations = filteredEvents.reduce(
      (sum, event) => sum + getRegistrationCount(event),
      0,
    );
    const totalCapacity = filteredEvents.reduce(
      (sum, event) => sum + getAttendeeCapacity(event),
      0,
    );

    const avgFillRate =
      totalCapacity > 0
        ? Math.round((totalRegistrations / totalCapacity) * 100)
        : 0;

    const overdueTasks = filteredTasks.filter((task) => {
      if (task.status !== "PENDING") {
        return false;
      }
      const deadline = parseDate(task.deadline || undefined);
      return deadline ? deadline < now : false;
    }).length;

    const finishedTasks = filteredTasks.filter(
      (task) => task.status === "DONE" || task.status === "CLOSED",
    ).length;

    const taskCompletionRate =
      filteredTasks.length > 0
        ? Math.round((finishedTasks / filteredTasks.length) * 100)
        : 0;

    return {
      totalEvents: events.length,
      totalRegistrations,
      avgFillRate,
      upcomingEvents: eventStatusSummary.upcomingCount,
      ongoingEvents: eventStatusSummary.ongoingCount,
      pastEvents: eventStatusSummary.pastCount,
      overdueTasks,
      taskCompletionRate,
    };
  }, [events.length, eventStatusSummary, filteredEvents, filteredTasks]);

  const registrationsTrend = useMemo(
    () => buildRegistrationsTrend(filteredEvents, timeRange),
    [filteredEvents, timeRange],
  );

  const eventsTrend = useMemo(
    () => buildEventsTrend(filteredEvents, timeRange),
    [filteredEvents, timeRange],
  );

  const tasksByStatus = useMemo(() => {
    const counts = {
      PENDING: 0,
      DONE: 0,
      CLOSED: 0,
    };

    for (const task of filteredTasks) {
      counts[task.status] += 1;
    }

    const total = filteredTasks.length || 1;

    return [
      {
        label: "Pending",
        value: counts.PENDING,
        color: "bg-amber-400",
        textColor: "text-amber-700",
        percentage: Math.round((counts.PENDING / total) * 100),
      },
      {
        label: "Done",
        value: counts.DONE,
        color: "bg-emerald-500",
        textColor: "text-emerald-700",
        percentage: Math.round((counts.DONE / total) * 100),
      },
      {
        label: "Closed",
        value: counts.CLOSED,
        color: "bg-slate-500",
        textColor: "text-slate-700",
        percentage: Math.round((counts.CLOSED / total) * 100),
      },
    ];
  }, [filteredTasks]);

  const topEvents = useMemo(
    () =>
      [...filteredEvents]
        .sort((a, b) => getRegistrationCount(b) - getRegistrationCount(a))
        .slice(0, 5),
    [filteredEvents],
  );

  const upcomingEventsTable = useMemo(
    () => eventStatusSummary.upcoming.slice(0, 8),
    [eventStatusSummary],
  );

  const ongoingEventsTable = useMemo(
    () => eventStatusSummary.ongoing.slice(0, 8),
    [eventStatusSummary],
  );

  if (loading) {
    return (
      <AdminLayout title="Admin Dashboard">
        <div className="h-full flex items-center justify-center text-gray-500">
          Loading dashboard analytics...
        </div>
      </AdminLayout>
    );
  }

  const maxRegistrationPoint =
    registrationsTrend.length > 0
      ? Math.max(...registrationsTrend.map((item) => item.value), 1)
      : 1;

  const maxEventsPoint =
    eventsTrend.length > 0
      ? Math.max(...eventsTrend.map((item) => item.value), 1)
      : 1;

  const maxTopEventCount =
    topEvents.length > 0
      ? Math.max(...topEvents.map((event) => getRegistrationCount(event)), 1)
      : 1;

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="px-6 py-6 md:px-8 md:py-8 bg-slate-50 min-h-full">
        {error && (
          <section className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
            <p className="font-semibold mb-1">Dashboard failed to load fully</p>
            <p>{error}</p>
          </section>
        )}

        {warning && (
          <section className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 text-sm">
            <p className="font-semibold mb-1">Partial data mode</p>
            <p>{warning}</p>
          </section>
        )}

        <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 mb-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Operations Overview
              </h2>
              <p className="text-sm text-slate-500">
                Track events, registrations, and team execution from one place.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(event) =>
                  setTimeRange(event.target.value as TimeRange)
                }
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700"
              >
                {DATE_RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => loadDashboardData(false)}
                className="h-10 px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
                disabled={refreshing}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Total Events"
            value={kpis.totalEvents.toLocaleString()}
            helper="All fetched events"
          />
          <KpiCard
            title="Upcoming Events"
            value={kpis.upcomingEvents.toLocaleString()}
            helper="Start date is in the future"
          />
          <KpiCard
            title="Ongoing Events"
            value={kpis.ongoingEvents.toLocaleString()}
            helper="Currently in progress"
          />
          <KpiCard
            title="Past Events"
            value={kpis.pastEvents.toLocaleString()}
            helper="Already finished"
          />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Tasks by Status
            </h3>
            <div className="space-y-3">
              {tasksByStatus.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <p className={`font-semibold ${item.textColor}`}>
                      {item.label}
                    </p>
                    <p className="text-slate-600">
                      {item.value} ({item.percentage}%)
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`${item.color} h-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Top Events by Registrations
            </h3>
            <div className="space-y-3">
              {topEvents.length === 0 && (
                <p className="text-sm text-slate-500">No event ranking data.</p>
              )}
              {topEvents.map((event) => {
                const registrationCount = getRegistrationCount(event);
                const width = Math.max(
                  (registrationCount / maxTopEventCount) * 100,
                  registrationCount > 0 ? 8 : 0,
                );

                return (
                  <div key={event.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <p className="font-semibold text-slate-700 truncate pr-2">
                        {event.title}
                      </p>
                      <p className="text-slate-600">{registrationCount}</p>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="bg-violet-500 h-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Upcoming Events
              </h3>
              <Link
                href="/events"
                className="text-xs font-semibold text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-2">Event</th>
                  <th className="py-2 pr-2">Start</th>
                  <th className="py-2 pr-2">Location</th>
                  <th className="py-2 pr-2">Fill %</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingEventsTable.length === 0 && (
                  <tr>
                    <td className="py-4 text-slate-500" colSpan={5}>
                      No upcoming events in this range.
                    </td>
                  </tr>
                )}
                {upcomingEventsTable.map((event) => {
                  const registrationCount = getRegistrationCount(event);
                  const capacity = getAttendeeCapacity(event);
                  const fillRate =
                    capacity > 0
                      ? Math.round((registrationCount / capacity) * 100)
                      : 0;

                  return (
                    <tr
                      key={event.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="py-3 pr-2 text-slate-800 font-medium">
                        {event.title}
                      </td>
                      <td className="py-3 pr-2 text-slate-600">
                        {formatDate(event.startDate)}
                      </td>
                      <td className="py-3 pr-2 text-slate-600">
                        {event.location || "TBD"}
                      </td>
                      <td className="py-3 pr-2 text-slate-700">{fillRate}%</td>
                      <td className="py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
                          Upcoming
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Ongoing Events
              </h3>
              <Link
                href="/events"
                className="text-xs font-semibold text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-2">Event</th>
                  <th className="py-2 pr-2">Start</th>
                  <th className="py-2 pr-2">End</th>
                  <th className="py-2 pr-2">Location</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {ongoingEventsTable.length === 0 && (
                  <tr>
                    <td className="py-4 text-slate-500" colSpan={5}>
                      No ongoing events right now.
                    </td>
                  </tr>
                )}
                {ongoingEventsTable.map((event) => {
                  return (
                    <tr
                      key={event.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="py-3 pr-2 text-slate-800 font-medium">
                        {event.title}
                      </td>
                      <td className="py-3 pr-2 text-slate-600">
                        {formatDate(event.startDate)}
                      </td>
                      <td className="py-3 pr-2 text-slate-600">
                        {formatDate(event.endDate || undefined)}
                      </td>
                      <td className="py-3 pr-2 text-slate-600">
                        {event.location || "TBD"}
                      </td>
                      <td className="py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                          Ongoing
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

function KpiCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {title}
      </p>
      <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{helper}</p>
    </div>
  );
}

function StatusPill({
  status,
  isOverdue,
}: {
  status: TaskStatus;
  isOverdue: boolean;
}) {
  if (isOverdue) {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 font-semibold">
        Overdue
      </span>
    );
  }

  if (status === "DONE") {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
        Done
      </span>
    );
  }

  if (status === "CLOSED") {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
        Closed
      </span>
    );
  }

  return (
    <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold">
      Pending
    </span>
  );
}

async function fetchJsonWithFallback(
  token: string,
  urls: string[],
): Promise<FetchFallbackResult> {
  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        continue;
      }
      return {
        ok: true,
        data: await response.json(),
        successfulUrl: url,
      };
    } catch {
      continue;
    }
  }

  return {
    ok: false,
    data: [],
  };
}

function buildApiCandidates(paths: string[]) {
  const candidates: string[] = [];

  for (const baseUrl of API_BASES) {
    for (const path of paths) {
      candidates.push(`${baseUrl}${path}`);
    }
  }

  return candidates;
}

function normalizeEvents(payload: unknown): Event[] {
  if (Array.isArray(payload)) {
    return payload as Event[];
  }

  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data as Event[];
  }

  return [];
}

function normalizeTasks(payload: unknown): Task[] {
  const rawTasks = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.data)
      ? payload.data
      : [];

  const normalized: Task[] = [];

  for (const task of rawTasks) {
    if (!isRecord(task)) {
      continue;
    }

    const id = task.id ? String(task.id) : "";
    if (!id) {
      continue;
    }

    const rawStatus = String(task.status || "PENDING").toUpperCase();
    const safeStatus: TaskStatus =
      rawStatus === "DONE" || rawStatus === "CLOSED" ? rawStatus : "PENDING";

    const eventTitle = task.eventTitle
      ? String(task.eventTitle)
      : task.event && isRecord(task.event) && task.event.title
        ? String(task.event.title)
        : undefined;

    normalized.push({
      id,
      title: String(task.title || "Untitled task"),
      deadline: task.deadline ? String(task.deadline) : null,
      status: safeStatus,
      eventId: task.eventId ? String(task.eventId) : undefined,
      eventTitle,
    });
  }

  return normalized;
}

async function enrichEventsWithRegistrationCounts(
  events: Event[],
  token: string,
) {
  return Promise.all(
    events.map(async (event) => {
      const existingCount = getRegistrationCount(event);
      if (existingCount > 0 || !event.id) {
        return event;
      }

      try {
        const registrationResult = await fetchJsonWithFallback(
          token,
          buildApiCandidates([
            `/registration/${event.id}`,
            `/registrations/${event.id}`,
          ]),
        );

        if (!registrationResult.ok) {
          return event;
        }

        const registrationPayload = registrationResult.data;

        const registrationList = Array.isArray(registrationPayload)
          ? registrationPayload
          : isRecord(registrationPayload) &&
              Array.isArray(registrationPayload.data)
            ? registrationPayload.data
            : null;

        if (registrationList) {
          return {
            ...event,
            registrations: registrationList,
            registrationCount: registrationList.length,
          };
        }

        if (isRecord(registrationPayload)) {
          const count = toNumber(registrationPayload.count);
          if (count > 0) {
            return {
              ...event,
              registrationCount: count,
            };
          }
        }
      } catch {
        return event;
      }

      return event;
    }),
  );
}

function getRegistrationCount(event: Event) {
  if (Array.isArray(event.registrations)) {
    return event.registrations.length;
  }

  return toNumber(
    event.registrationCount ??
      event.registrationsCount ??
      event.registeredCount ??
      event.attendeeCount ??
      event.totalRegistrations ??
      event._count?.registrations,
  );
}

function getAttendeeCapacity(event: Event) {
  return toNumber(event.attendeeCapacity);
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object";
}

function parseDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function formatDate(value?: string) {
  const parsed = parseDate(value);
  if (!parsed) {
    return "TBD";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getEventLifecycleStatus(
  event: Event,
  now: Date,
): "UPCOMING" | "ONGOING" | "PAST" | "UNKNOWN" {
  const start = parseDate(event.startDate);
  const end = parseDate(event.endDate || undefined);

  if (!start) {
    return "UNKNOWN";
  }

  if (start > now) {
    return "UPCOMING";
  }

  if (end && end < now) {
    return "PAST";
  }

  return "ONGOING";
}

function isEventWithinRange(event: Event, range: TimeRange) {
  const eventDate = parseDate(event.startDate || event.createdAt);
  if (!eventDate) {
    return false;
  }

  return isDateWithinRange(eventDate, range);
}

function isTaskWithinRange(task: Task, range: TimeRange) {
  const taskDate = parseDate(task.deadline || undefined);
  if (!taskDate) {
    return range === "all";
  }

  return isDateWithinRange(taskDate, range);
}

function isDateWithinRange(date: Date, range: TimeRange) {
  if (range === "all") {
    return true;
  }

  const now = new Date();

  if (range === "month") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  const days = range === "7d" ? 7 : 30;
  const threshold = new Date();
  threshold.setHours(0, 0, 0, 0);
  threshold.setDate(threshold.getDate() - (days - 1));

  return date >= threshold && date <= now;
}

function buildRegistrationsTrend(events: Event[], range: TimeRange) {
  const buckets = createBuckets(range);

  for (const event of events) {
    const eventDate = parseDate(event.startDate || event.createdAt);
    if (!eventDate) {
      continue;
    }
    const key = getBucketKey(eventDate, range);
    if (!key || !(key in buckets)) {
      continue;
    }
    buckets[key] += getRegistrationCount(event);
  }

  return Object.keys(buckets).map((key) => ({
    label: key,
    value: buckets[key],
  }));
}

function buildEventsTrend(events: Event[], range: TimeRange) {
  const buckets = createBuckets(range);

  for (const event of events) {
    const createdDate = parseDate(event.createdAt || event.startDate);
    if (!createdDate) {
      continue;
    }

    const key = getBucketKey(createdDate, range);
    if (!key || !(key in buckets)) {
      continue;
    }

    buckets[key] += 1;
  }

  return Object.keys(buckets).map((key) => ({
    label: key,
    value: buckets[key],
  }));
}

function createBuckets(range: TimeRange) {
  const now = new Date();
  const buckets: Record<string, number> = {};

  if (range === "all") {
    for (let i = 11; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = date.toLocaleDateString("en-US", { month: "short" });
      buckets[label] = 0;
    }
    return buckets;
  }

  if (range === "month") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    for (
      let cursor = new Date(firstDay);
      cursor <= now;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const label = cursor.toLocaleDateString("en-US", { day: "2-digit" });
      buckets[label] = 0;
    }
    return buckets;
  }

  const totalDays = range === "7d" ? 7 : 30;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (totalDays - 1));

  for (let i = 0; i < totalDays; i += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const label = current.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
    buckets[label] = 0;
  }

  return buckets;
}

function getBucketKey(date: Date, range: TimeRange) {
  if (range === "all") {
    return date.toLocaleDateString("en-US", { month: "short" });
  }

  if (range === "month") {
    return date.toLocaleDateString("en-US", { day: "2-digit" });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
}
