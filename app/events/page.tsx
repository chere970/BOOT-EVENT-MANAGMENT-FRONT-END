"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { RiGroupLine } from "react-icons/ri";
import { FaStar } from "react-icons/fa";

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  imageUrl?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  registrations?: any[];
}

type EventFilter = "All" | "Today" | "Last Year" | "Upcoming Events";

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeFilter, setActiveFilter] = useState<EventFilter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:3000/event");
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Could not load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDateLabel = (startDateString?: string) => {
    let month = "JAN";
    let day = "01";
    let timeStr = "Time TBD";

    if (startDateString) {
      try {
        const start = new Date(startDateString);
        if (!isNaN(start.getTime())) {
          month = start
            .toLocaleDateString("en-US", { month: "short" })
            .toUpperCase();
          day = start.toLocaleDateString("en-US", { day: "2-digit" });
          timeStr = start.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } catch (e) {}
    }

    return { month, day, time: timeStr };
  };

  const parseEventDate = (dateString?: string) => {
    if (!dateString) {
      return null;
    }

    const parsed = new Date(dateString);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const filters: EventFilter[] = [
    "All",
    "Today",
    "Last Year",
    "Upcoming Events",
  ];

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const tomorrowStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );
    const lastYear = now.getFullYear() - 1;

    return events.filter((event) => {
      const eventStartDate = parseEventDate(event.startDate);

      if (!eventStartDate) {
        return activeFilter === "All";
      }

      if (activeFilter === "Today") {
        return eventStartDate >= todayStart && eventStartDate < tomorrowStart;
      }

      if (activeFilter === "Last Year") {
        return eventStartDate.getFullYear() === lastYear;
      }

      if (activeFilter === "Upcoming Events") {
        return eventStartDate >= todayStart;
      }

      return true;
    });
  }, [activeFilter, events]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500 font-medium">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* <div>
          <h2 className="text-2xl font-bold text-gray-900">Events</h2>
          <p className="text-sm text-gray-500">
            Manage and create upcoming events.
          </p>
        </div> */}
        {/* <Link
          href="/create-event"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Create Event
        </Link> */}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border ${
              activeFilter === f
                ? "bg-gray-200 border-gray-300 text-gray-700"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const { month, day, time } = formatDateLabel(event.startDate);
          const registrationsCount =
            event.registrations?.length ||
            Math.floor(Math.random() * 5000) + 100;
          const coverImage = event.imageUrl?.trim();
          // "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80";

          // const categories = [
          //   "Sports & Fitness",
          //   "Education & Academic Events",
          //   "Ceremonies & Celebrations",
          // ];
          const mockCategory = event.title;

          return (
            <Link
              key={event.id}
              href={`/event-detail?id=${event.id}`}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 block hover:shadow-md transition-shadow group"
            >
              {/* Image Container */}
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={coverImage}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0">
                  <span className="bg-yellow-400 text-gray-900 text-[10px] font-bold px-3 py-1 rounded-tr-lg rounded-bl-sm">
                    {mockCategory}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 flex">
                {/* Date Block */}
                <div className="flex flex-col items-center mr-5 min-w-12">
                  <span className="text-blue-600 font-bold text-sm tracking-wider">
                    {month}
                  </span>
                  <span className="text-blue-600 font-light text-4xl leading-none mt-1">
                    {day}
                  </span>
                </div>

                {/* Details Block */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 truncate">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2 truncate">
                    {event.location || "Online / Unknown Location"}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">{time}</p>

                  {/* Footer Row */}
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="flex items-center space-x-1.5">
                      <RiGroupLine size={16} />
                      <span className="font-medium">
                        {registrationsCount.toLocaleString()}
                        {registrationsCount > 4000 ? "+" : ""}
                      </span>
                    </div>
                    <span className="mx-2 text-gray-300">•</span>
                    <div className="flex items-center space-x-0.5 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} size={14} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {filteredEvents.length === 0 && !loading && !error && (
          <p className="text-gray-500 col-span-3 text-center py-10">
            No events found for "{activeFilter}".
          </p>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
