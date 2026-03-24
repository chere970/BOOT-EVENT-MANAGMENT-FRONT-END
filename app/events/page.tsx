"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

interface Event {
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

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
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

  const formatDateLabel = (startDateString?: string, endDateString?: string) => {
    let month = "JAN";
    let day = "01";
    let timeStr = "Time TBD";

    if (startDateString) {
      try {
        const start = new Date(startDateString);
        if (!isNaN(start.getTime())) {
          month = start.toLocaleDateString('en-US', { month: 'short' });
          day = start.toLocaleDateString('en-US', { day: '2-digit' });
          timeStr = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          
          if (endDateString) {
            const end = new Date(endDateString);
            if (!isNaN(end.getTime())) {
              const isSameDay = start.toDateString() === end.toDateString();
              const endTimeStr = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              
              if (isSameDay) {
                timeStr += ` - ${endTimeStr}`;
              } else {
                const endDateStr = end.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
                timeStr += ` to ${endDateStr} ${endTimeStr}`;
              }
            }
          }
        }
      } catch (e) {}
    }
    
    return { month, day, time: timeStr };
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>Upcoming Events</h1>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>Upcoming Events</h1>
        <p className={styles.errorText}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Upcoming Events</h1>
      <div className={styles.eventsGrid}>
        {events.map((event, index) => {
          const { month, day, time } = formatDateLabel(event.startDate, event.endDate);
          const registrationsCount = event.registrations?.length || 0;
          
          // Select mock image by index
          const mockImages = [
            "https://images.unsplash.com/photo-1540324155970-143aa31e5d07?w=800&q=80",
            "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80",
            "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
          ];
          const mockImage = mockImages[index % mockImages.length];
          
          const categories = ["Worship", "Wedding", "Youth Conference"];
          const mockCategory = categories[index % categories.length];

          return (
            <Link key={event.id} href={`/event-detail?id=${event.id}`} className={styles.eventCard} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className={styles.imageContainer}>
                {/* Normally we'd use next/image but setting to unoptimized without config or using generic img tag is easier for arbitrary unsplash URLs. Switching to regular img to avoid unconfigured remotePatterns errors in Next.js */}
                <img 
                  src={mockImage} 
                  alt={event.title} 
                  className={styles.eventImage}
                />
                <div className={styles.categoryBadge}>{mockCategory}</div>
              </div>
              
              <div className={styles.contentContainer}>
                <div className={styles.dateBlock}>
                  <span className={styles.monthText}>{month}</span>
                  <span className={styles.dayText}>{day}</span>
                </div>
                
                <div className={styles.detailsBlock}>
                  <h3 className={styles.titleText}>{event.title}</h3>
                  <p className={styles.locationText}>{event.location || "Online / Unknown Location"}</p>
                  <p className={styles.timeText}>{time}</p>
                  
                  <div className={styles.footerRow}>
                    <div className={styles.attendeesContainer}>
                      <svg className={styles.attendeesIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                      </svg>
                      <span>{registrationsCount > 0 ? registrationsCount : (Math.floor(Math.random() * 5000) + 100)}</span>
                    </div>
                    <span className={styles.dotSeparator}>•</span>
                    <div className={styles.starsContainer}>
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={styles.starIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {events.length === 0 && !loading && !error && (
          <p className={styles.loadingText}>No events found.</p>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
