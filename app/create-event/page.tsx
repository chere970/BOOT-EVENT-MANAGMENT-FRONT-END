"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

interface CurrentUser {
  id?: string;
}

export default function CreateEventPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    createdById: "",
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
      if (parsedUser?.id) {
        setFormData((prev) => ({
          ...prev,
          createdById: String(parsedUser.id),
        }));
      }
    } catch (parseError) {
      console.error("Failed to parse user from localStorage:", parseError);
    }
  }, []);

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
      // 1. Create the event first
      const eventResponse = await fetch("http://localhost:3000/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
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
      <h1 className={styles.pageTitle}>Enter event detals below </h1>

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
              Event Image (Supabase Hosted)
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
