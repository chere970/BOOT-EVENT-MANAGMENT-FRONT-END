"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "../components/AdminLayout";

interface EventItem {
  id: string;
  title: string;
  startDate: string;
  location?: string;
}

interface StoredUser {
  fullName?: string;
  name?: string;
  username?: string;
  role?: string;
  userRole?: string;
}

export default function MemberPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser));
      } catch (parseError) {
        console.error("Failed to parse user from localStorage:", parseError);
      }
    }

    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:3000/event");
        if (!response.ok) {
          throw new Error("Failed to load events");
        }

        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const displayName =
    user?.fullName || user?.name || user?.username || "Member";

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => {
        const parsed = new Date(event.startDate);
        return !Number.isNaN(parsed.getTime()) && parsed >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      )
      .slice(0, 5);
  }, [events]);

  return (
    <AdminLayout title="Member Dashboard">
      <div className="bg-gray-50 p-6 md:p-8 min-h-full">
        <div className="max-w-6xl mx-auto space-y-6">
          <section className="rounded-2xl bg-white border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome, {displayName}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Discover events, join invitations, and keep track of upcoming
              activities.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/events"
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-900">
                  Browse Events
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Explore all available events and open details.
                </p>
              </Link>

              <Link
                href="/events"
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-900">
                  Joined & Upcoming
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Track your next activities from the events list.
                </p>
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-900">
                  Account Access
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Re-authenticate when invitation links request login.
                </p>
              </Link>
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Upcoming Events
              </h3>
              <Link
                href="/events"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <p className="mt-4 text-sm text-gray-500">Loading events...</p>
            ) : upcomingEvents.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                No upcoming events available right now.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-gray-100">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/event-detail?id=${event.id}`}
                    className="block py-3 hover:bg-gray-50 px-2 rounded-lg transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(event.startDate).toLocaleString()}
                      {event.location ? ` • ${event.location}` : ""}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
