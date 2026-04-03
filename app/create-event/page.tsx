"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

interface CurrentUser {
  id?: string;
  role?: string;
  userRole?: string;
}

export default function CreateEventPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    atendeeCapacity: "",
    startDate: "",
    endDate: "",
    createdById: "",
    goalTitle: "",
    goalDescription: "",
    noteContent: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      return;
    }

    try {
      const parsedUser: CurrentUser = JSON.parse(rawUser);
      const activeRole = (parsedUser.role || parsedUser.userRole || "")
        .toString()
        .toUpperCase();

      if (activeRole !== "ADMIN") {
        setError(
          "Only Admins can create events. You do not have permission to access this page.",
        );
        router.push(activeRole === "MEMBER" ? "/member" : "/dashbord");
        return;
      }

      if (parsedUser?.id) {
        setFormData((prev) => ({
          ...prev,
          createdById: String(parsedUser.id),
        }));
      }
    } catch (parseError) {
      console.error("Failed to parse user from localStorage:", parseError);
    }
  }, [router]);

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
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = "http://localhost:3000/event";
      const method = "POST";

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("authToken");
      const authHeaders: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      // 1. Create the event first
      const eventResponse = await fetch(endpoint, {
        method,
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
      });

      if (!eventResponse.ok) {
        throw new Error(
          "Failed to create the event. Please verify organizer ID and fields.",
        );
      }

      const createdEvent = await eventResponse.json();
      const eventId = createdEvent.id;

      if (!eventId) {
        throw new Error(
          "Event created, but failed to retrieve the new event ID.",
        );
      }

      // 2. If there is an image, upload it to the supabase endpoint
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("file", imageFile);

        const imageResponse = await fetch(
          `http://localhost:3000/event/${eventId}/image`,
          {
            method: "POST",
            headers: authHeaders,
            body: imageFormData,
          },
        );

        if (!imageResponse.ok) {
          const errText = await imageResponse.text();
          console.error("Image upload error response:", errText);
          throw new Error(
            `Event created, but failed to upload the image: ${errText}`,
          );
        }
      }
      // 3. (Optional) Create Event Goal
      if (formData.goalTitle.trim()) {
        try {
          await fetch("http://localhost:3000/event-goal", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({
              title: formData.goalTitle,
              description: formData.goalDescription || undefined,
              eventId,
            }),
          });
        } catch (e) {
          console.error("Failed to create optional goal:", e);
        }
      }

      // 4. (Optional) Create Event Note
      if (formData.noteContent.trim()) {
        try {
          await fetch("http://localhost:3000/event-note", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({
              content: formData.noteContent,
              eventId,
              userId: formData.createdById || undefined,
            }),
          });
        } catch (e) {
          console.error("Failed to create optional note:", e);
        }
      }
      setSuccess("Event created successfully! Redirecting...");

      // Redirect after success
      setTimeout(() => {
        router.push("/events");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Enter event details below</h1>

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
              Event Image
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

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="createdById">
              Organizer User ID *
            </label>
            <input
              className={styles.input}
              id="createdById"
              name="createdById"
              type="text"
              value={formData.createdById}
              onChange={handleInputChange}
              required
              placeholder="User ID or UUID"
            />
          </div>

          <div className="my-6 border-t border-gray-200"></div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Optional Event Metadata
          </h2>

          {/* Goal Section */}
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-4">
            <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
              <span>🎯</span> Initial Goal
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
              <span>📋</span> Initial Staff Note
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
            {loading ? "Creating Event..." : "Create Event"}
          </button>
        </form>
      </div>
    </div>
  );
}
