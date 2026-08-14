"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { RiCalendarLine, RiMapPinLine, RiTicketLine, RiQrCodeLine } from "react-icons/ri";

interface Ticket {
  id: string;
  eventId: string;
  ticketNumber?: string;
  token?: string;
  createdAt: string;
  event?: {
    id: string;
    title: string;
    startDate: string;
    location?: string;
    imageUrl?: string;
  };
}

export default function MyTicketsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    const fetchTickets = async () => {
      try {
        setLoading(true);
        // Try fetching user tickets from /registration or /user/registrations
        const res = await apiFetch("/registration/my-tickets");

        if (res.ok) {
          const data = await res.json();
          setTickets(Array.isArray(data) ? data : data?.data || []);
        } else {
          // Fallback to fetch all registrations or filter by user
          const fallbackRes = await apiFetch("/registration");
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            const list = Array.isArray(data) ? data : data?.data || [];
            // Filter by userId matching current logged in user if available
            const myRegs = list.filter(
              (item: any) =>
                item.userId === user.id || item.userEmail === user.email,
            );
            setTickets(myRegs.length > 0 ? myRegs : list);
          }
        }
      } catch (err: any) {
        console.error("Failed to load tickets", err);
        setError("Could not load your event tickets.");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user, authLoading]);

  return (
    <AdminLayout title="My Tickets">
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              My Event Passes & Tickets
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Present your QR code ticket at event check-in.
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
          >
            <RiTicketLine size={18} />
            <span>Browse More Events</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs animate-pulse"
              >
                <div className="h-40 bg-gray-200 rounded-xl mb-4" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center">
            {error}
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RiTicketLine size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Tickets Found</h2>
            <p className="text-gray-500 text-sm mb-6">
              You haven't registered for any events yet. Browse our upcoming events to join!
            </p>
            <Link
              href="/events"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition"
            >
              Explore Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => {
              const qrPayload = JSON.stringify({
                ticketId: ticket.id,
                eventId: ticket.eventId,
                userId: user?.id,
                token: ticket.token || ticket.ticketNumber || ticket.id,
              });

              const eventTitle =
                ticket.event?.title || `Event #${ticket.eventId || ticket.id.slice(0, 6)}`;
              const eventDate = ticket.event?.startDate
                ? new Date(ticket.event.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "TBA";
              const location = ticket.event?.location || "Main Venue";

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">
                          Confirmed Ticket
                        </span>
                        <h2 className="text-lg font-bold text-gray-900 mt-2 line-clamp-1">
                          {eventTitle}
                        </h2>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-gray-600 mb-6">
                      <div className="flex items-center space-x-2">
                        <RiCalendarLine className="text-gray-400" size={16} />
                        <span>{eventDate}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RiMapPinLine className="text-gray-400" size={16} />
                        <span>{location}</span>
                      </div>
                    </div>

                    {/* QR Code Container */}
                    <div className="bg-gray-50 p-4 rounded-xl flex flex-col items-center justify-center border border-gray-100">
                      <QRCodeSVG value={qrPayload} size={140} level="M" />
                      <p className="text-[11px] font-mono text-gray-400 mt-3 truncate max-w-full">
                        ID: {ticket.ticketNumber || ticket.token || ticket.id.slice(0, 12)}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="w-full flex items-center justify-center space-x-2 py-2 bg-white text-blue-600 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-50 transition"
                    >
                      <RiQrCodeLine size={16} />
                      <span>Full QR Ticket</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for viewing QR ticket fullscreen / check-in modal */}
        {selectedTicket && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={() => setSelectedTicket(null)}
          >
            <div
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900">
                {selectedTicket.event?.title || "Event Ticket"}
              </h3>
              <p className="text-xs text-gray-500">
                Scan this QR code at the check-in desk
              </p>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 inline-block shadow-inner">
                <QRCodeSVG
                  value={JSON.stringify({
                    ticketId: selectedTicket.id,
                    eventId: selectedTicket.eventId,
                    userId: user?.id,
                    token: selectedTicket.token || selectedTicket.ticketNumber || selectedTicket.id,
                  })}
                  size={200}
                  level="H"
                />
              </div>

              <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                Ticket: {selectedTicket.ticketNumber || selectedTicket.id}
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition"
              >
                Close Ticket
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
