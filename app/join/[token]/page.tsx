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

interface CurrentUser {
  id?: string;
  email?: string;
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

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authToken, setAuthToken] = useState<string>("");
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

        const storedToken =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token") ||
          "";
        setAuthToken(storedToken);

        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          try {
            setCurrentUser(JSON.parse(rawUser));
          } catch (parseError) {
            console.error(
              "Failed to parse user from localStorage:",
              parseError,
            );
          }
        }
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

    if (!authToken) {
      alert("Please log in or sign up to accept this invitation.");
      return;
    }

    setIsSubmitting(true);

    try {
      let response = await fetch(`http://localhost:3000/invite/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token }),
      });

      // Backward-compatible fallback for older backend versions.
      if (response.status === 404) {
        response = await fetch(`http://localhost:3000/registration`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            eventId: eventData.id,
            userId: currentUser?.id,
            userEmail: currentUser?.email || undefined,
          }),
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        let errorMessage = errData.message;
        if (Array.isArray(errorMessage)) errorMessage = errorMessage.join(", ");
        throw new Error(errorMessage || "Registration failed.");
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
  const loginRedirect = token
    ? `/login?next=${encodeURIComponent(`/join/${token}`)}`
    : "/login";
  const registrationRedirect = token
    ? `/registration?next=${encodeURIComponent(`/join/${token}`)}`
    : "/registration";

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
            {authToken ? (
              <p className={styles.helperText} style={{ marginBottom: "8px" }}>
                Signed in as {currentUser?.email || "your account"}. Click Join
                Event to accept this invitation.
              </p>
            ) : (
              <div
                style={{
                  marginTop: "8px",
                  marginBottom: "8px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                }}
              >
                <p style={{ margin: 0, color: "#1e3a8a", fontSize: "0.95rem" }}>
                  Please log in or create an account first to accept this
                  invitation.
                </p>
                <div
                  style={{ display: "flex", gap: "12px", marginTop: "12px" }}
                >
                  <Link
                    href={loginRedirect}
                    className={styles.registerButton}
                    style={{
                      width: "auto",
                      textDecoration: "none",
                      padding: "10px 16px",
                      fontSize: "0.95rem",
                    }}
                  >
                    Log In
                  </Link>
                  <Link
                    href={registrationRedirect}
                    className={styles.registerButton}
                    style={{
                      width: "auto",
                      textDecoration: "none",
                      padding: "10px 16px",
                      fontSize: "0.95rem",
                    }}
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}

            <button
              className={styles.registerButton}
              onClick={handleRegister}
              disabled={isSubmitting || !authToken}
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
