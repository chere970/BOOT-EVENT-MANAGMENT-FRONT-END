"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../event-detail/page.module.css"; // Reuse the event detail styling

interface EventDetail {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  imageUrl?: string;
}

export default function JoinEventPage() {
  const params = useParams();
  const router = useRouter();

  // Extract token from route parameter. useParams() might return an array if catch-all route,
  // but for [token] it defaults to string or array of strings.
  const tokenParam = params?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  const [eventData, setEventData] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided.");
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/invite/validate/${token}`,
        );
        if (!response.ok) {
          throw new Error("Invalid or expired invitation link.");
        }
        const data = await response.json();
        // The backend returns { event: ..., inviteId: ..., token: ... }
        setEventData(data.event);

        // check local storage to autofill
        const storedUserId = localStorage.getItem("test_user_id") || "";
        const storedEmail = localStorage.getItem("test_user_email") || "";
        setCurrentUserId(storedUserId);
        setCurrentEmail(storedEmail);
      } catch (err: any) {
        console.error("Token validation error:", err);
        setError(err.message || "Failed to validate invitation.");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleRegister = async () => {
    if (!eventData) return;

    if (!currentUserId || currentUserId.trim().length === 0) {
      alert("Please provide a valid User ID first!");
      return;
    }

    setIsSubmitting(true);
    localStorage.setItem("test_user_id", currentUserId);
    localStorage.setItem("test_user_email", currentEmail);

    try {
      const response = await fetch(`http://localhost:3000/registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: eventData.id,
          userId: currentUserId,
          userEmail: currentEmail || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        let errorMessage = errData.message;
        if (Array.isArray(errorMessage)) errorMessage = errorMessage.join(", ");
        throw new Error(
          errorMessage ||
            "Registration failed. You might already be registered.",
        );
      }

      setRegistered(true);
      alert("Successfully joined the event!");

      // Redirect to the event details page after a short delay
      setTimeout(() => {
        router.push(`/event-detail?id=${eventData.id}`);
      }, 2000);
    } catch (err: any) {
      console.error("Registration error:", err);
      alert(`Error joining event: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <p className={styles.loadingText}>Validating invitation...</p>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className={styles.pageContainer}>
        <div
          style={{
            textAlign: "center",
            marginTop: "80px",
            padding: "40px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ color: "#ef4444", marginBottom: "16px" }}>
            Invitation Error
          </h2>
          <p style={{ color: "#4b5563", marginBottom: "24px" }}>
            {error || "Event not found"}
          </p>
          <Link
            href="/events"
            className={styles.registerButton}
            style={{
              textDecoration: "none",
              display: "inline-block",
              width: "auto",
              padding: "10px 24px",
            }}
          >
            Go to All Events
          </Link>
        </div>
      </div>
    );
  }

  const coverImage = eventData.imageUrl?.trim() || "/window.svg";

  return (
    <div className={styles.pageContainer}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", color: "#1f2937", fontWeight: "800" }}>
          You've been invited! 🎉
        </h1>
        <p style={{ color: "#4b5563", fontSize: "1.1rem" }}>
          Join {eventData.title} by confirming your registration below.
        </p>
      </div>

      <div
        className={styles.heroSection}
        style={{ marginBottom: "32px", height: "300px" }}
      >
        <img
          src={coverImage}
          alt={eventData.title}
          className={styles.coverImage}
          style={{ height: "300px" }}
        />
        <div className={styles.heroOverlay}>
          <h2 className={styles.eventTitle} style={{ fontSize: "2.5rem" }}>
            {eventData.title}
          </h2>
        </div>
      </div>

      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          background: "white",
          padding: "32px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <h3
          className={styles.sectionTitle}
          style={{ textAlign: "center", fontSize: "1.5rem" }}
        >
          Accept Invitation
        </h3>

        {registered ? (
          <div
            className={styles.successBox}
            style={{ textAlign: "center", padding: "24px" }}
          >
            <p
              className={styles.successTitle}
              style={{
                justifyContent: "center",
                fontSize: "1.2rem",
                marginBottom: "12px",
              }}
            >
              <svg
                style={{ width: 24, height: 24, marginRight: "8px" }}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.8 14.8L6 12.6l1.4-1.4 2.8 2.8 6.4-7.8 1.4 1.2-7.8 9.4z" />
              </svg>
              You're in!
            </p>
            <p className={styles.successMessage}>
              Registration complete. Redirecting to the event...
            </p>
          </div>
        ) : (
          <>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Your User ID</label>
              <input
                type="text"
                className={styles.input}
                value={currentUserId}
                onChange={(e) => setCurrentUserId(e.target.value)}
                placeholder="Enter your user ID..."
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Your Email (Optional)</label>
              <input
                type="email"
                className={styles.input}
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                placeholder="Enter your email..."
              />
            </div>

            <button
              className={styles.registerButton}
              onClick={handleRegister}
              disabled={isSubmitting}
              style={{ marginTop: "16px" }}
            >
              {isSubmitting ? "Joining..." : "Join Event"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
