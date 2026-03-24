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

  useEffect(() => {
    if (!id) {
      setError("No event ID provided.");
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        const response = await fetch(`http://localhost:3000/event/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch event details");
        }
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Could not load event data. It may not exist or the server could be down.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

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

  const formatFullDate = (dateString?: string) => {
    if (!dateString) return "Date to be announced";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Unknown Date";
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return "Unknown Date";
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "Time TBD";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Unknown Time";
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "Unknown Time";
    }
  };

  // Create a pseudo-random stable cover image based on event ID
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
                // Simplistic split for paragraphs if there are newlines, otherwise just display
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
                <span className={styles.infoValue}>{formatFullDate(event.startDate)}</span>
                <span className={styles.infoValue} style={{ color: "#6b7280", fontSize: "0.95rem" }}>
                  {formatTime(event.startDate)} {event.endDate ? ` - ${formatTime(event.endDate)}` : ""}
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

            <button className={styles.registerButton}>
              Register Now
            </button>
            
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
