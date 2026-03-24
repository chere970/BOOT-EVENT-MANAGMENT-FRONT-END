"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

interface EventDetail {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  registrations?: any[];
}

const EventDetailContent = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRegistered, setIsRegistered] = useState(false);
  // const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentEmail, setCurrentEmail] = useState<string>("");

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

        // Pre-fill user ID if one was stored in local storage for testing
        const storedUserId = localStorage.getItem("test_user_id") || "";
        const storedEmail = localStorage.getItem("test_user_email") || "";
        setCurrentUserId(storedUserId);
        setCurrentEmail(storedEmail);

        if (storedUserId) {
          const regResponse = await fetch(`http://localhost:3000/registration/${id}`);
          if (regResponse.ok) {
            const registrations = await regResponse.json();
            const myRegistration = registrations.find((r: any) => r.userId === storedUserId);
            if (myRegistration) {
              setIsRegistered(true);
              // setTicketNumber(myRegistration.ticketNumber || null);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Could not load data. It may not exist or the server could be down.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleRegisterToggle = async () => {
    if (!event) return;
    
    if (!currentUserId || currentUserId.trim().length === 0) {
      alert("Please provide a valid User ID first!");
      return;
    }

    setIsSubmitting(true);
    localStorage.setItem("test_user_id", currentUserId);
    localStorage.setItem("test_user_email", currentEmail);

    try {
      if (isRegistered) {
        // Cancel registration
        const response = await fetch(`http://localhost:3000/registration/${id}/${currentUserId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to cancel registration");
        }
        
        setIsRegistered(false);
        // setTicketNumber(null);
        alert("Registration cancelled successfully.");
      } else {
        // Register for event
        const response = await fetch(`http://localhost:3000/registration`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: id,
            userId: currentUserId,
            userEmail: currentEmail || undefined
          }),
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          let errorMessage = errData.message;
          if (Array.isArray(errorMessage)) errorMessage = errorMessage.join(", ");
          throw new Error(errorMessage || "Failed to register. Your User ID may not exist in the database.");
        }
        
        const newRegWrapper = await response.json();
        const newReg = newRegWrapper.data || newRegWrapper; // Support wrapper or direct
        
        setIsRegistered(true);
        // setTicketNumber(newReg.ticketNumber || "Ticket Confirmation Sent");
        alert("Successfully registered!");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      alert(`Registration failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.pageContainer}><p className={styles.loadingText}>Loading event details...</p></div>;
  }

  if (error || !event) {
    return (
      <div className={styles.pageContainer}>
        <p className={styles.errorText}>{error || "Event not found"}</p>
        <Link href="/events" className={styles.backButton}>
          <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          Back to Events
        </Link>
      </div>
    );
  }

  const formatFullDate = (startDateString?: string, endDateString?: string) => {
    if (!startDateString) return "Date to be announced";
    try {
      const start = new Date(startDateString);
      if (isNaN(start.getTime())) return "Unknown Date";
      
      const startStr = start.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });

      if (endDateString && new Date(endDateString).toDateString() !== start.toDateString()) {
        const end = new Date(endDateString);
        return `${startStr} - ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
      }
      return startStr;
    } catch {
      return "Unknown Date";
    }
  };

  const formatTime = (startDateString?: string, endDateString?: string) => {
    if (!startDateString) return "Time TBD";
    try {
      const start = new Date(startDateString);
      if (isNaN(start.getTime())) return "Unknown Time";
      
      const timeStr = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      if (endDateString && new Date(endDateString).toDateString() === start.toDateString()) {
        const end = new Date(endDateString);
        return `${timeStr} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      }
      return timeStr;
    } catch {
      return "Unknown Time";
    }
  };

  const mockImages = [
    "https://images.unsplash.com/photo-1540324155970-143aa31e5d07?w=1600&q=80",
    "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1600&q=80",
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&q=80",
  ];
  const charCodeCodeSum = Array.from(event.id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const coverImage = mockImages[charCodeCodeSum % mockImages.length];

  const categories = ["Live Event", "Workshop", "Conference", "Meetup", "Webinar"];
  const category = categories[charCodeCodeSum % categories.length];

  return (
    <div className={styles.pageContainer}>
      <Link href="/events" className={styles.backButton}>
        <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        Back to all events
      </Link>

      <div className={styles.heroSection}>
        <img 
          src={coverImage} 
          alt={event.title} 
          className={styles.coverImage} 
        />
        <div className={styles.heroOverlay}>
          <div className={styles.badge}>{category}</div>
          <h1 className={styles.eventTitle}>{event.title}</h1>
        </div>
      </div>

      <div className={styles.contentRow}>
        <div className={styles.mainColumn}>
          <div>
            <h2 className={styles.sectionTitle}>About this event</h2>
            <div className={styles.descriptionBox}>
              {event.description ? (
                event.description.split('\n').map((paragraph, index) => (
                  <p key={index} style={{ marginBottom: "16px" }}>
                    {paragraph}
                  </p>
                ))
              ) : (
                <p>No description provided for this event yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.sideColumn}>
          <div className={styles.infoCard}>
            
            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}>
                <svg viewBox="0 0 24 24">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/>
                </svg>
              </div>
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Date & Time</span>
                <span className={styles.infoValue}>{formatFullDate(event.startDate, event.endDate)}</span>
                <span className={styles.infoValue} style={{ color: "#6b7280", fontSize: "0.95rem" }}>
                  {formatTime(event.startDate, event.endDate)}
                </span>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}>
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Location</span>
                <span className={styles.infoValue}>{event.location || "Online / TBD"}</span>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "8px", fontWeight: "600", textTransform: "uppercase" }}>
                Simulation User ID
              </label>
              <input 
                type="text" 
                value={currentUserId}
                onChange={(e) => setCurrentUserId(e.target.value)}
                placeholder="Enter valid User ID here (e.g. 2)..."
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.95rem", boxSizing: "border-box" }}
              />
              <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px", marginBottom: "0" }}>
                You must input an existing User ID from your backend database to successfully register.
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "8px", fontWeight: "600", textTransform: "uppercase" }}>
                Simulation Email
              </label>
              <input 
                type="email" 
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                placeholder="Enter an email to receive your ticket..."
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.95rem", boxSizing: "border-box" }}
              />
            </div>

            {isRegistered ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ padding: "16px", backgroundColor: "#ecfdf5", border: "1px solid #10b981", borderRadius: "8px", color: "#065f46" }}>
                  <p style={{ margin: "0 0 4px 0", fontWeight: "600" }}>✓ You are registered</p>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>You are registered for this event.We will send you an email with the ticket details. <strong style={{ fontFamily: "monospace", fontSize: "1rem" }}></strong></p>
                </div>
                <button 
                  className={styles.registerButton} 
                  style={{ backgroundColor: "#ef4444", boxShadow: "0 4px 6px rgba(239, 68, 68, 0.2)" }}
                  onClick={handleRegisterToggle}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Canceling..." : "Cancel Registration"}
                </button>
              </div>
            ) : (
              <button 
                className={styles.registerButton} 
                onClick={handleRegisterToggle}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Register Now"}
              </button>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default function EventDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>}>
      <EventDetailContent />
    </Suspense>
  );
}
