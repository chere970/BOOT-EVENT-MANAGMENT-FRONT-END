"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
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
          <div className="w-full h-[60vh] rounded-[32px] overflow-hidden mb-12 shadow-sm border border-gray-100">
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
