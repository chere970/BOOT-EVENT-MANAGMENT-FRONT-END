"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Event = {
  id: string;
  title: string;
  description: String;
  startDate: string;
  endDate: string | null;
  location: string | null;
};

type Task = {
  id: string;
  title: string;
  description: String;
  deadline: string | null;
  status: "PENDING" | "DONE" | "CLOSED";
};

export default function Dashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTasks: 0,
    upcomingEvents: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
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

      try {
        setLoading(true);
        const eventsRes = await fetch("http://localhost:3000/events?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!eventsRes.ok) throw new Error("Failed to fetch events");
        const eventsData = await eventsRes.json();
        setEvents(eventsData);

        const tasksRes = await fetch("http://localhost:3000/tasks?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!tasksRes.ok) throw new Error("Failed to fetch tasks");
        const tasksData = await tasksRes.json();
        setTasks(tasksData);

        const allEventsRes = await fetch("http://localhost:3000/events", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allTasksRes = await fetch("http://localhost:3000/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (allEventsRes.ok && allTasksRes.ok) {
          const allEvents = await allEventsRes.json();
          const allTasks = await allTasksRes.json();

          const now = new Date();
          const upcoming = allEvents.filter(
            (e: Event) => new Date(e.startDate) > now,
          ).length;
          const completed = allTasks.filter(
            (t: Task) => t.status === "DONE",
          ).length;

          setStats({
            totalEvents: allEvents.length,
            totalTasks: allTasks.length,
            upcomingEvents: upcoming,
            completedTasks: completed,
          });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Events" value={stats.totalEvents} />
          <StatCard title="Total Tasks" value={stats.totalTasks} />
          <StatCard title="Upcoming Events" value={stats.upcomingEvents} />
          <StatCard title="Completed Tasks" value={stats.completedTasks} />
        </div>

        {/* Recent Events and Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Events Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Recent Events
              </h2>
              <Link
                href="/events/new"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                + New Event
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm">No events yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {events.map((event) => (
                  <li key={event.id} className="py-3">
                    <Link
                      href={`/events/${event.id}`}
                      className="block hover:bg-gray-50 -mx-2 px-2 rounded"
                    >
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(event.startDate).toLocaleDateString()}
                        {event.location && ` · ${event.location}`}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 text-right">
              <Link
                href="/events"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                View all events →
              </Link>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Recent Tasks
              </h2>
              <Link
                href="/tasks/new"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                + New Task
              </Link>
            </div>
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-sm">No tasks yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <li key={task.id} className="py-3">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="block hover:bg-gray-50 -mx-2 px-2 rounded"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          {task.title}
                        </p>
                        <StatusBadge status={task.status} />
                      </div>
                      {task.deadline && (
                        <div className="text-sm text-gray-500 mt-1">
                          Due: {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 text-right">
              <Link
                href="/tasks"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                View all tasks →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper components
function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    PENDING: "bg-yellow-100 text-yellow-800",
    DONE: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-800",
  };
  const classes = styles[status as keyof typeof styles] || styles.PENDING;
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}
