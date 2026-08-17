export interface EventCoordinates {
  latitude?: number | null;
  longitude?: number | null;
}

export function hasEventCoordinates(
  event: EventCoordinates,
): event is EventCoordinates & { latitude: number; longitude: number } {
  return (
    typeof event.latitude === "number" &&
    Number.isFinite(event.latitude) &&
    typeof event.longitude === "number" &&
    Number.isFinite(event.longitude)
  );
}

export function getGoogleMapsSearchUrl(
  location?: string | null,
  coordinates?: EventCoordinates,
): string | null {
  if (coordinates && hasEventCoordinates(coordinates)) {
    return `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;
  }

  const trimmedLocation = location?.trim();
  if (!trimmedLocation) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmedLocation)}`;
}

export function getGoogleMapsEmbedUrl(
  location?: string | null,
  coordinates?: EventCoordinates,
): string | null {
  if (coordinates && hasEventCoordinates(coordinates)) {
    return `https://maps.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}&z=15&output=embed`;
  }

  const trimmedLocation = location?.trim();
  if (!trimmedLocation) {
    return null;
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(trimmedLocation)}&z=15&output=embed`;
}
