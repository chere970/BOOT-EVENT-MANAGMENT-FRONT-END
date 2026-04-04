"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { RiMapPinLine, RiCalendarLine } from "react-icons/ri";
import AdminLayout from "../components/AdminLayout";

// ─── Interfaces ───────────────────────────────────────────────────────────────

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
  id?: string | number;
  userId?: string | number;
  sub?: string | number;
  role?: string;
  userRole?: string;
  user?: {
    id?: string | number;
    userId?: string | number;
    sub?: string | number;
    role?: string;
    userRole?: string;
  };
}

interface EventGoal {
  id: string;
  title: string;
  description?: string;
  eventId: string;
  createdAt: string;
}

interface EventNote {
  id: string;
  content: string;
  eventId: string;
  userId: string | number;
  createdAt: string;
  user?: { id: string; fullName?: string; name?: string; username?: string };
}

const resolveUserId = (user?: CurrentUser | null) => {
  if (!user) {
    return "";
  }

  const rawId =
    user.id ??
    user.userId ??
    user.sub ??
    user.user?.id ??
    user.user?.userId ??
    user.user?.sub;
  return rawId === undefined || rawId === null ? "" : String(rawId);
};

const resolveUserRole = (user?: CurrentUser | null) => {
  if (!user) {
    return "";
  }

  const rawRole =
    user.role ?? user.userRole ?? user.user?.role ?? user.user?.userRole;
  return rawRole ? String(rawRole).toUpperCase() : "";
};

const parseErrorMessage = async (response: Response) => {
  const fallback = `Server error (${response.status})`;

  try {
    const text = await response.text();
    if (!text) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(text);
      const message = parsed?.message ?? parsed?.error;
      if (Array.isArray(message)) {
        return message.join(", ");
      }
      if (typeof message === "string" && message.trim()) {
        return message;
      }
      return text;
    } catch {
      return text;
    }
  } catch {
    return fallback;
  }
};

// ─── Goals Panel  ─────────────────────────────────────────────────────────────

function EventGoalsPanel({
  eventId,
  isAdmin,
  token,
}: {
  eventId: string;
  isAdmin: boolean;
  token: string;
}) {
  const [goals, setGoals] = useState<EventGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const hasToken = Boolean(token && token.trim());

  const authHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(hasToken
      ? {
          Authorization: `Bearer ${token}`,
          "x-access-token": token,
          "x-auth-token": token,
        }
      : {}),
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch(`http://localhost:3000/event-goal/${eventId}`, {
        headers: authHeaders,
      });
      if (res.ok) setGoals(await res.json());
    } catch (e) {
      console.error("Failed to fetch goals", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (!hasToken) {
      setGoalError("Your session has expired. Please log in again.");
      return;
    }

    setGoalError(null);
    setSubmitting(true);

    const payloads: Array<Record<string, string | undefined>> = [
      {
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        eventId,
      },
      {
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        event_id: eventId,
      },
    ];

    try {
      let lastError = "Failed to add goal.";

      for (const payload of payloads) {
        const res = await fetch("http://localhost:3000/event-goal", {
          method: "POST",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setNewTitle("");
          setNewDesc("");
          fetchGoals();
          return;
        }

        lastError = await parseErrorMessage(res);

        // Do not retry on auth/permission failures.
        if (res.status === 401 || res.status === 403) {
          break;
        }
      }

      setGoalError(lastError);
    } catch (e: any) {
      setGoalError(e?.message || "Network error. Please try again.");
      console.error("[EventGoal] POST exception:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`http://localhost:3000/event-goal/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (e) {
      console.error("Failed to delete goal", e);
    }
  };

  const startEdit = (goal: EventGoal) => {
    setEditingId(goal.id);
    setEditTitle(goal.title);
    setEditDesc(goal.description || "");
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3000/event-goal/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim() || undefined,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchGoals();
      }
    } catch (e) {
      console.error("Failed to update goal", e);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🎯</span>
        <div>
          <h2 className="text-lg font-bold text-amber-900">Event Goals</h2>
          <p className="text-xs text-amber-700">
            Objectives and targets for this event
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-amber-600 py-2">Loading goals...</p>
      ) : goals.length === 0 ? (
        <p className="text-sm text-amber-600 italic py-2">
          No goals added yet.
        </p>
      ) : (
        <ul className="space-y-3 mb-5">
          {goals.map((goal) =>
            editingId === goal.id ? (
              <li
                key={goal.id}
                className="bg-white rounded-xl border border-amber-200 p-3 space-y-2"
              >
                <input
                  className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-amber-400"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Goal title"
                />
                <input
                  className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-amber-300"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description (optional)"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(goal.id)}
                    className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ) : (
              <li
                key={goal.id}
                className="flex items-start justify-between bg-white rounded-xl border border-amber-100 px-4 py-3 gap-3"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-400">◆</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {goal.title}
                    </p>
                    {goal.description && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {goal.description}
                      </p>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => startEdit(goal)}
                      className="rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ),
          )}
        </ul>
      )}

      {isAdmin && (
        <form
          onSubmit={handleAdd}
          className="space-y-2 pt-3 border-t border-amber-200"
        >
          <p className="text-xs font-semibold text-amber-800 mb-2">
            Add New Goal
          </p>
          <input
            className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            placeholder="Goal title (e.g. Reach 500 attendees)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <input
            className="w-full rounded-xl border border-amber-100 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60 transition"
          >
            {submitting ? "Adding..." : "Add Goal"}
          </button>
          {goalError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              ⚠ {goalError}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

// ─── Notes Panel  ─────────────────────────────────────────────────────────────

function EventNotesPanel({
  eventId,
  currentUserId,
  token,
}: {
  eventId: string;
  currentUserId: string;
  token: string;
}) {
  const [notes, setNotes] = useState<EventNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const hasToken = Boolean(token && token.trim());

  const authHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(hasToken
      ? {
          Authorization: `Bearer ${token}`,
          "x-access-token": token,
          "x-auth-token": token,
        }
      : {}),
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch(`http://localhost:3000/event-note/${eventId}`, {
        headers: authHeaders,
      });
      if (res.ok) setNotes(await res.json());
    } catch (e) {
      console.error("Failed to fetch notes", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!hasToken) {
      setSubmitError("Your session has expired. Please log in again.");
      return;
    }

    if (!newContent.trim()) {
      setSubmitError("Note content cannot be empty.");
      return;
    }

    const resolvedUserId = String(currentUserId || "").trim();

    if (!resolvedUserId) {
      setSubmitError(
        "Could not identify your user account. Please log out and log in again.",
      );
      return;
    }

    setSubmitting(true);

    const payloads: Array<Record<string, string>> = [
      { content: newContent.trim(), eventId, userId: resolvedUserId },
      { content: newContent.trim(), eventId },
      { content: newContent.trim(), event_id: eventId, userId: resolvedUserId },
      { content: newContent.trim(), event_id: eventId },
    ];

    try {
      let lastError = "Failed to post note.";

      for (const payload of payloads) {
        const res = await fetch("http://localhost:3000/event-note", {
          method: "POST",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setNewContent("");
          fetchNotes();
          return;
        }

        lastError = await parseErrorMessage(res);

        // Do not retry on auth/permission failures.
        if (res.status === 401 || res.status === 403) {
          break;
        }
      }

      setSubmitError(lastError);
    } catch (e: any) {
      setSubmitError(e?.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`http://localhost:3000/event-note/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error("Failed to delete note", e);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3000/event-note/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ content: editContent.trim() }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchNotes();
      }
    } catch (e) {
      console.error("Failed to update note", e);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📋</span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Staff Notes</h2>
          <p className="text-xs text-slate-500">
            Internal memos visible only to staff
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 py-2">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-2">
          No notes yet. Add the first one below.
        </p>
      ) : (
        <ul className="space-y-3 mb-5">
          {notes.map((note) => {
            const authorName =
              note.user?.fullName ||
              note.user?.name ||
              note.user?.username ||
              "Staff";
            const isOwner = note.userId === currentUserId;
            return (
              <li
                key={note.id}
                className="bg-white rounded-xl border border-slate-200 px-4 py-3"
              >
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(note.id)}
                        className="rounded-lg bg-slate-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-900 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {note.content}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {authorName} · {formatDate(note.createdAt)}
                      </p>
                    </div>
                    {isOwner && (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(note.id);
                            setEditContent(note.content);
                          }}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form
        onSubmit={handleAdd}
        className="space-y-2 pt-3 border-t border-slate-200"
      >
        <p className="text-xs font-semibold text-slate-700 mb-2">Add a Note</p>
        <textarea
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 resize-none"
          placeholder="e.g. AV team arrives at 8AM, parking at Lot C..."
          rows={3}
          value={newContent}
          onChange={(e) => {
            setNewContent(e.target.value);
            if (submitError) setSubmitError(null);
          }}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-900 disabled:opacity-60 transition"
        >
          {submitting ? "Posting..." : "Post Note"}
        </button>
        {submitError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            ⚠ {submitError}
          </p>
        )}
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const EventDetailContent = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authToken, setAuthToken] = useState("");

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
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("authToken") ||
      "";
    setAuthToken(token);
    if (!rawUser) return;
    try {
      const parsedUser: CurrentUser = JSON.parse(rawUser);
      setCurrentUser(parsedUser);
    } catch (e) {
      console.error("Failed to parse user", e);
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
        const res = await fetch(`http://localhost:3000/event/${id}`);
        if (!res.ok) throw new Error("Failed to fetch event details");
        setEvent(await res.json());
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

  const activeRole = resolveUserRole(currentUser);
  const currentUserId = resolveUserId(currentUser);
  const isAdmin = activeRole === "ADMIN";
  const isVolunteer = activeRole === "VOLUNTEER";
  const isStaff = isAdmin || isVolunteer;

  const isOrganizerOwner =
    !!currentUserId && currentUserId === event.createdById.toString();
  const canSendInvitations =
    isAdmin || isVolunteer || activeRole === "ORGANIZER" || isOrganizerOwner;

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
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const payload = { eventId: event.id, email: normalizedEmail };
    try {
      const endpoints = [
        "http://localhost:3000/invite",
        "http://localhost:3000/invitation",
      ];
      let success = false;
      let lastError = "Failed to send invitation.";
      for (const endpoint of endpoints) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          success = true;
          break;
        }
        const errData = await res.json().catch(() => ({}));
        const message = errData?.message;
        lastError = Array.isArray(message)
          ? message.join(", ")
          : message || lastError;
        if (res.status !== 404) break;
      }
      if (!success) throw new Error(lastError);
      setInviteSuccessMessage(`Invitation sent to ${normalizedEmail}.`);
      setInviteEmail("");
    } catch (err: any) {
      setInviteErrorMessage(err?.message || "Failed to send invitation.");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const parseEventDate = (dateString?: string) => {
    if (!dateString) return null;
    const parsed = new Date(dateString);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatEventDateRange = (
    startDateString?: string,
    endDateString?: string,
  ) => {
    const start = parseEventDate(startDateString);
    const end = parseEventDate(endDateString);

    if (!start) return "Time TBD";

    const startLabel = start.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (!end) return startLabel;

    const endLabel = end.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${startLabel} - ${endLabel}`;
  };

  const coverImage = event.imageUrl?.trim();
  const dateTimeRange = formatEventDateRange(event.startDate, event.endDate);

  return (
    <AdminLayout title={event.title}>
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_#fef3c7_0%,_#ffffff_38%,_#eef2ff_100%)] p-6 md:p-8">
        <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="pointer-events-none absolute top-24 -right-28 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Hero Image */}
          <div className="w-full rounded-4xl overflow-hidden mb-10 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)] border border-white/60 relative group bg-slate-50/80 backdrop-blur-sm">
            <img
              src={coverImage}
              alt={event.title}
              className="block w-full h-auto object-contain"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-900/65 via-slate-900/15 to-transparent" />
            <div className="absolute left-5 bottom-5 rounded-2xl border border-white/30 bg-white/15 px-4 py-3 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
                Featured Event
              </p>
              <h2 className="mt-1 text-xl md:text-2xl font-extrabold text-white">
                {event.title}
              </h2>
            </div>
            {isAdmin && (
              <div className="absolute top-6 right-6 z-10">
                <Link
                  href={`/edit-event?id=${event.id}`}
                  className="group flex items-center gap-2.5 rounded-full bg-white/95 backdrop-blur-md px-6 py-3 text-sm font-bold text-gray-900 shadow-lg hover:shadow-xl hover:bg-white transition-all transform hover:scale-105"
                >
                  <span className="text-blue-600 bg-blue-100 p-1.5 rounded-full flex items-center justify-center shrink-0">
                    ✏️
                  </span>
                  <span>Edit Event</span>
                </Link>
              </div>
            )}
          </div>

          {/* Event Metadata (Date & Location) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 -mt-2">
            <div className="flex items-center text-slate-700 bg-white/80 px-5 py-4 rounded-2xl border border-white shadow-sm backdrop-blur-md">
              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 shadow-sm mr-4">
                <RiCalendarLine className="text-blue-600" size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.16em] mb-0.5">
                  Date & Time
                </p>
                <p className="font-semibold text-slate-900">{dateTimeRange}</p>
              </div>
            </div>

            <div className="flex items-center text-slate-700 bg-white/80 px-5 py-4 rounded-2xl border border-white shadow-sm backdrop-blur-md">
              <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100 shadow-sm mr-4">
                <RiMapPinLine className="text-rose-500" size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.16em] mb-0.5">
                  Location
                </p>
                <p className="font-semibold text-slate-900 md:truncate md:max-w-xs">
                  {event.location || "Online / Unknown Location"}
                </p>
              </div>
            </div>
          </div>

          {/* Event Description */}
          <div className="mb-12 rounded-3xl border border-white bg-white/85 p-6 md:p-8 shadow-sm backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-4">
              About This Event
            </p>
            <div className="max-w-none text-slate-800 font-semibold leading-relaxed space-y-6 text-[15px] md:text-base tracking-wide">
              {event.description ? (
                event.description.split("\n").map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p>The {event.title} was successfully organized...</p>
              )}
            </div>
          </div>

          {/* Volunteer Tools Banner */}
          {isVolunteer && (
            <div className="mb-8 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-indigo-900">
                  Volunteer Tools
                </h2>
                <p className="mt-1 text-sm text-indigo-700">
                  Access your portal to scan tickets and manage attendee
                  check-ins.
                </p>
              </div>
              <Link
                href="/organizer/scan"
                className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md transform hover:-translate-y-0.5"
              >
                📸 Open Ticket Scanner
              </Link>
            </div>
          )}

          {/* ── Event Planning Panel (Goals + Notes) ─────────────── */}
          {isStaff && (
            <div className="mb-10 rounded-3xl border border-white bg-white/80 p-5 md:p-6 shadow-sm backdrop-blur-md">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
                Event Planning Panel
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Manage goals and internal staff notes for this event.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Goals */}
                <EventGoalsPanel
                  eventId={event.id}
                  isAdmin={isAdmin}
                  token={authToken}
                />
                {/* Notes (staff only) */}
                <EventNotesPanel
                  eventId={event.id}
                  currentUserId={currentUserId}
                  token={authToken}
                />
              </div>
            </div>
          )}

          {/* Goals read-only view for regular members */}
          {!isStaff && (
            <EventGoalsPanel
              eventId={event.id}
              isAdmin={false}
              token={authToken}
            />
          )}

          {/* Send Invitation */}
          {canSendInvitations && (
            <div className="mt-8 mb-12 rounded-3xl border border-white bg-gradient-to-br from-slate-50 via-white to-blue-50 p-5 md:p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Send Invitation
                </h2>
                <p className="mt-1 text-sm text-slate-600">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12" />
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
