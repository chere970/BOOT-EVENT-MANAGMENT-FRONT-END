"use client";

import React, { useEffect, useState, Suspense } from "react";
import styles from "../create-event/page.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLayout from "../components/AdminLayout";

interface CurrentUser {
  id?: string;
  role?: string;
  userRole?: string;
}

const API_BASES = ["http://localhost:3000", "http://localhost:3002"];

function buildApiCandidates(paths: string[]) {
  const candidates: string[] = [];
  for (const base of API_BASES) {
    for (const path of paths) {
      candidates.push(`${base}${path}`);
    }
  }
  return candidates;
}

async function requestWithFallback(
  urls: string[],
  init?: RequestInit,
): Promise<{ response: Response; url: string }> {
  let lastResponse: Response | null = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, init);
      if (response.ok) {
        return { response, url };
      }
      lastResponse = response;
    } catch {
      continue;
    }
  }

  if (lastResponse) {
    return { response: lastResponse, url: "" };
  }

  throw new Error("No available API endpoint responded successfully.");
}

async function requestWithMethodFallback(
  urls: string[],
  methods: string[],
  init?: RequestInit,
): Promise<{ response: Response; url: string; method: string }> {
  let lastResponse: Response | null = null;

  for (const method of methods) {
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          ...init,
          method,
        });
        if (response.ok) {
          return { response, url, method };
        }
        lastResponse = response;
      } catch {
        continue;
      }
    }
  }

  if (lastResponse) {
    return { response: lastResponse, url: "", method: methods[0] || "PATCH" };
  }

  throw new Error("No available API endpoint responded successfully.");
}

export default function EditEventPage() {
  return (
    <Suspense fallback={<div className={styles.pageContainer}>Loading...</div>}>
      <EditEventContent />
    </Suspense>
  );
}

function EditEventContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    atendeeCapacity: "",
    startDate: "",
    endDate: "",
    goalTitle: "",
    goalDescription: "",
    noteContent: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formatForInput = (dateString?: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser: CurrentUser = JSON.parse(rawUser);
      const activeRole = (parsedUser.role || parsedUser.userRole || "")
        .toString()
        .toUpperCase();

      if (activeRole !== "ADMIN") {
        setError(
          "Only Admins can edit events. You do not have permission to access this page.",
        );
        router.push(activeRole === "MEMBER" ? "/member" : "/dashbord");
        return;
      }
    } catch (parseError) {
      console.error("Failed to parse user from localStorage:", parseError);
    }
  }, [router]);

  useEffect(() => {
    if (!editId) {
      setError("No event ID provided to edit.");
      return;
    }

    const fetchEvent = async () => {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token") ||
          localStorage.getItem("authToken");
        const authHeaders: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const candidates = buildApiCandidates([
          `/event/${editId}`,
          `/events/${editId}`,
        ]);

        const { response: res } = await requestWithFallback(candidates, {
          headers: authHeaders,
        });

        if (!res.ok) throw new Error("Failed to fetch event data.");
        const data = await res.json();

        setFormData((prev) => ({
          ...prev,
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
          atendeeCapacity: data.attendeeCapacity || data.atendee_capacity || "",
          startDate: formatForInput(data.startDate),
          endDate: formatForInput(data.endDate),
        }));
      } catch (err: any) {
        console.error("Error loading event:", err);
        setError("Could not load event data to edit. It might not exist.");
      }
    };
    fetchEvent();
  }, [editId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("authToken");

      const authHeaders: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const updateCandidates = buildApiCandidates([
        `/event/${editId}`,
        `/events/${editId}`,
        `/event/update/${editId}`,
        `/events/update/${editId}`,
      ]);

      const { response: eventResponse } = await requestWithMethodFallback(
        updateCandidates,
        ["PATCH", "PUT"],
        {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            ...formData,
            attendeeCapacity: formData.atendeeCapacity
              ? Number(formData.atendeeCapacity)
              : undefined,
            atendeeCapacity: formData.atendeeCapacity
              ? Number(formData.atendeeCapacity)
              : undefined,
            endDate: formData.endDate || undefined,
            description: formData.description || undefined,
            location: formData.location || undefined,
          }),
        },
      );

      if (!eventResponse.ok) {
        let errMsg = "Failed to update the event.";
        try {
          const errData = await eventResponse.json();
          errMsg = errData.message || errMsg;
        } catch (e) {}
        throw new Error(errMsg);
      }

      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("file", imageFile);

        const imageCandidates = buildApiCandidates([
          `/event/${editId}/image`,
          `/events/${editId}/image`,
        ]);

        const { response: imageResponse } = await requestWithFallback(
          imageCandidates,
          {
            method: "POST",
            headers: authHeaders,
            body: imageFormData,
          },
        );

        if (!imageResponse.ok) {
          const errText = await imageResponse.text();
          throw new Error(
            `Event updated, but failed to upload the image: ${errText}`,
          );
        }
      }

      // Optional: Add new Goal on update
      if (formData.goalTitle.trim()) {
        try {
          const goalCandidates = buildApiCandidates(["/event-goal"]);
          await requestWithFallback(goalCandidates, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({
              title: formData.goalTitle,
              description: formData.goalDescription || undefined,
              eventId: editId,
            }),
          });
        } catch (e) {
          console.error("Failed to create optional goal during edit:", e);
        }
      }

      // Optional: Add new Staff Note on update
      if (formData.noteContent.trim()) {
        try {
          // get user ID from cache directly since we only have raw user in local storage
          const rawUser = localStorage.getItem("user");
          let userId;
          if (rawUser) {
            const pu = JSON.parse(rawUser);
            userId = pu.id || pu.userId || pu.sub;
          }

          const noteCandidates = buildApiCandidates(["/event-note"]);
          await requestWithFallback(noteCandidates, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({
              content: formData.noteContent,
              eventId: editId,
              userId: userId || undefined,
            }),
          });
        } catch (e) {
          console.error("Failed to create optional note during edit:", e);
        }
      }

      setSuccess("Event updated successfully! Redirecting...");

      setTimeout(() => {
        router.push(`/event-detail?id=${editId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Edit Event">
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>Edit Event Details</h1>

        <div className={styles.formCard}>
          {error && <div className={styles.errorMsg}>{error}</div>}
          {success && <div className={styles.successMsg}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="title">
                Event Title *
              </label>
              <input
                className={styles.input}
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="E.g., Summer Music Festival"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="description">
                Description
              </label>
              <textarea
                className={styles.textarea}
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell people what this event is about..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="location">
                Location
              </label>
              <input
                className={styles.input}
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="E.g., Central Park, NY or Online"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="atendeeCapacity">
                Attendee Capacity
              </label>
              <input
                className={styles.input}
                id="atendeeCapacity"
                name="atendeeCapacity"
                type="number"
                min="1"
                value={formData.atendeeCapacity}
                onChange={handleInputChange}
                placeholder="E.g., 250"
              />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="startDate">
                  Start Date & Time *
                </label>
                <input
                  className={styles.input}
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="endDate">
                  End Date & Time
                </label>
                <input
                  className={styles.input}
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="image">
                New Event Image (Optional)
              </label>
              <input
                className={styles.fileInput}
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <div className="my-6 border-t border-gray-200"></div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Quick Add Metadata
            </h2>

            {/* Goal Section */}
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-4">
              <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                <span>🎯</span> Add New Goal
              </h3>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="goalTitle">
                  Goal Title
                </label>
                <input
                  className={`${styles.input} border-amber-200 focus:ring-amber-300`}
                  id="goalTitle"
                  name="goalTitle"
                  type="text"
                  value={formData.goalTitle}
                  onChange={handleInputChange}
                  placeholder="E.g., Sell 500 tickets"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="goalDescription">
                  Goal Description
                </label>
                <textarea
                  className={`${styles.textarea} border-amber-200 focus:ring-amber-300`}
                  id="goalDescription"
                  name="goalDescription"
                  value={formData.goalDescription}
                  onChange={handleInputChange}
                  placeholder="Optional details about this goal..."
                />
              </div>
            </div>

            {/* Note Section */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span>📋</span> Add Staff Note
              </h3>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="noteContent">
                  Note Content
                </label>
                <textarea
                  className={`${styles.textarea} border-slate-200 focus:ring-slate-300`}
                  id="noteContent"
                  name="noteContent"
                  value={formData.noteContent}
                  onChange={handleInputChange}
                  placeholder="E.g., Remind team to book catering by Friday."
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || success !== null}
            >
              {loading ? "Saving Changes..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
