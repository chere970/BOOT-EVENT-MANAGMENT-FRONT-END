"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminLayout from "../components/AdminLayout";

interface EventDetail {
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

interface CurrentUser {
  id?: string;
  role?: string;
  userRole?: string;
}

const EventDetailContent = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState<
    string | null
  >(null);
  const [inviteErrorMessage, setInviteErrorMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      return;
    }

    try {
      setCurrentUser(JSON.parse(rawUser));
    } catch (parseError) {
      console.error("Failed to parse user from localStorage:", parseError);
    }
  }, []);

  useEffect(() => {
    if (!id) {
      setError("No event ID provided.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const eventResponse = await fetch(`http://localhost:3000/event/${id}`);
        if (!eventResponse.ok) {
          throw new Error("Failed to fetch event details");
        }
        const eventData = await eventResponse.json();
        setEvent(eventData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          "Could not load data. It may not exist or the server could be down.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <AdminLayout title="Loading Event...">
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500 font-medium">Loading event details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !event) {
    return (
      <AdminLayout title="Error">
        <div className="flex h-64 items-center justify-center">
          <p className="text-red-500 font-medium">
            {error || "Event not found"}
          </p>
        </div>
      </AdminLayout>
    );
  }

  const activeRole = (currentUser?.role || currentUser?.userRole || "")
    .toString()
    .toUpperCase();
  const isOrganizerOwner =
    !!currentUser?.id &&
    currentUser.id.toString() === event.createdById.toString();
  const canSendInvitations =
    activeRole === "ADMIN" ||
    activeRole === "VOLUNTEER" ||
    activeRole === "ORGANIZER" ||
    isOrganizerOwner;

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = inviteEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    setInviteSuccessMessage(null);
    setInviteErrorMessage(null);

    if (!emailRegex.test(normalizedEmail)) {
      setInviteErrorMessage("Please enter a valid email address.");
      return;
    }

    setInviteSubmitting(true);
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const payload = {
      eventId: event.id,
      email: normalizedEmail,
    };

    try {
      // Some API versions expose /invite and others /invitation; this keeps the UI compatible.
      const endpoints = [
        "http://localhost:3000/invite",
        "http://localhost:3000/invitation",
      ];

      let success = false;
      let lastError = "Failed to send invitation.";

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          success = true;
          break;
        }

        const errData = await response.json().catch(() => ({}));
        const message = errData?.message;
        lastError = Array.isArray(message)
          ? message.join(", ")
          : message || lastError;

        if (response.status !== 404) {
          break;
        }
      }

      if (!success) {
        throw new Error(lastError);
      }

      setInviteSuccessMessage(`Invitation sent to ${normalizedEmail}.`);
      setInviteEmail("");
    } catch (err: any) {
      setInviteErrorMessage(err?.message || "Failed to send invitation.");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const coverImage = event.imageUrl?.trim();
  // "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80";

  // Mock gallery images for the bottom section
  // const galleryImages = [
  //   "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=400&q=80",
  //   "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=400&q=80",
  //   "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=400&q=80",
  // ];

  return (
    <AdminLayout title={event.title}>
      <div className="bg-white p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Main Hero Image */}
          <div className="w-full h-[60vh] rounded-4xl overflow-hidden mb-12 shadow-sm border border-gray-100">
            <img
              src={coverImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Event Description */}
          <div className="max-w-none text-gray-900 font-bold leading-relaxed mb-16 space-y-6 text-base tracking-wide">
            {event.description ? (
              event.description
                .split("\n")
                .map((paragraph, index) => <p key={index}>{paragraph}</p>)
            ) : (
              <p>The {event.title} was successfully organized... </p>
            )}

            {/* Fallback mock text if description is short to match screenshot perfectly */}
            {/* {(!event.description || event.description.length < 50) && (
              <>
                <p>
                  The {event.title} 2024 was successfully organized as the
                  annual graduation ceremony for the Institute of Information
                  Technology. The event marked a significant milestone for
                  graduating students, with over 4000 attendees, including
                  graduates, family members, faculty, and invited dignitaries.
                </p>
                <p>
                  The ceremony featured keynote addresses from academic leaders
                  and industry experts, followed by the official awarding of
                  degrees across multiple faculties. Attendee engagement was
                  high, with smooth coordination of seating, registration, and
                  entry management through the system. Ticket reservations and
                  check-ins were tracked digitally, ensuring efficient crowd
                  flow and minimizing delays.
                </p>
                <p>
                  Overall, the event was rated as highly successful, with 98% of
                  planned capacity achieved and positive feedback from both
                  attendees and organizers. The management system played a key
                  role in tracking ticket distribution, attendee insights, and
                  post-event analytics, making the convocation a benchmark for
                  future large-scale academic events.
                </p>
              </> */}
            {/* )} */}
          </div>

          {canSendInvitations && (
            <div className="mb-12 rounded-2xl border border-gray-200 bg-gray-50 p-5 md:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Send Invitation
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Invite attendees by email to join this event.
                </p>
              </div>

              <form
                onSubmit={handleSendInvitation}
                className="flex flex-col gap-3 md:flex-row"
              >
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  disabled={inviteSubmitting}
                  required
                />
                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="inline-flex min-w-42.5 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {inviteSubmitting ? "Sending..." : "Send Invitation"}
                </button>
              </form>

              {inviteSuccessMessage && (
                <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {inviteSuccessMessage}
                </p>
              )}
              {inviteErrorMessage && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {inviteErrorMessage}
                </p>
              )}
            </div>
          )}

          {/* Gallery Thumbnail Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
            {/* {galleryImages.map((src, i) => (
              <div
                key={i}
                className="h-48 md:h-56 rounded-sm overflow-hidden border border-gray-200"
              >
                <img
                  src={src}
                  alt={`Gallery image ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))} */}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default function EventDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-gray-50 items-center justify-center font-sans">
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      }
    >
      <EventDetailContent />
    </Suspense>
  );
}
