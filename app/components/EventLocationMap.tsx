"use client";

import React from "react";
import {
  getGoogleMapsEmbedUrl,
  getGoogleMapsSearchUrl,
  type EventCoordinates,
} from "@/lib/maps";

interface EventLocationMapProps {
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
  className?: string;
}

export default function EventLocationMap({
  location,
  latitude,
  longitude,
  title = "Event location map",
  className = "",
}: EventLocationMapProps) {
  const coordinates: EventCoordinates = { latitude, longitude };
  const embedUrl = getGoogleMapsEmbedUrl(location, coordinates);
  const searchUrl = getGoogleMapsSearchUrl(location, coordinates);

  if (!embedUrl || !searchUrl) {
    return null;
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}
    >
      <iframe
        title={title}
        src={embedUrl}
        className="h-64 w-full border-0 md:h-80"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm">
        <p className="truncate text-gray-600">{location || "View on map"}</p>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 font-semibold text-blue-600 hover:text-blue-700"
        >
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}
