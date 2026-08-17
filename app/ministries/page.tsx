"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  RiCommunityLine,
  RiGroupLine,
  RiCalendarEventLine,
  RiArrowRightLine,
  RiSearchLine,
} from "react-icons/ri";

export interface Ministry {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  membersCount?: number;
  eventCount?: number;
  eventsCount?: number;
  _count?: {
    members?: number;
    events?: number;
  };
  members?: any[];
  events?: any[];
}

export default function MinistriesListPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchMinistries() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch("/ministries");
        if (!res.ok) {
          throw new Error("Failed to load ministries");
        }
        const data = await res.json();
        const list: Ministry[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setMinistries(list);
      } catch (err: any) {
        setError(err?.message || "Failed to load ministries list.");
      } finally {
        setLoading(false);
      }
    }

    fetchMinistries();
  }, []);

  const parseMemberCount = (m: Ministry): number => {
    if (typeof m.memberCount === "number") return m.memberCount;
    if (typeof m.membersCount === "number") return m.membersCount;
    if (typeof m._count?.members === "number") return m._count.members;
    if (Array.isArray(m.members)) return m.members.length;
    return 0;
  };

  const parseEventCount = (m: Ministry): number => {
    if (typeof m.eventCount === "number") return m.eventCount;
    if (typeof m.eventsCount === "number") return m.eventsCount;
    if (typeof m._count?.events === "number") return m._count.events;
    if (Array.isArray(m.events)) return m.events.length;
    return 0;
  };

  const filteredMinistries = ministries.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-700 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex items-center space-x-3 mb-2">
          <RiCommunityLine size={32} className="text-emerald-200" />
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Our Ministries
          </h1>
        </div>
        <p className="text-emerald-100 max-w-2xl text-sm md:text-base leading-relaxed">
          Discover our active ministry groups. Connect, serve, and grow together in fellowship.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <RiSearchLine
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ministries..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-xs"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-500 font-medium animate-pulse">Loading ministries...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
          <p className="text-red-600 font-medium text-sm">{error}</p>
        </div>
      ) : filteredMinistries.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100">
          <RiCommunityLine size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-800">No ministries found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery ? "Try adjusting your search criteria." : "There are currently no active ministries."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMinistries.map((ministry) => {
            const memberCount = parseMemberCount(ministry);
            const eventCount = parseEventCount(ministry);

            return (
              <Link
                key={ministry.id}
                href={`/ministries/${ministry.id}`}
                className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-105 transition-transform">
                    {ministry.name?.charAt(0).toUpperCase() || "M"}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-2">
                    {ministry.name}
                  </h2>
                  <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-6">
                    {ministry.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center gap-1.5" title="Members">
                      <RiGroupLine size={16} className="text-emerald-600" />
                      {memberCount} {memberCount === 1 ? "Member" : "Members"}
                    </span>
                    <span className="flex items-center gap-1.5" title="Events">
                      <RiCalendarEventLine size={16} className="text-emerald-600" />
                      {eventCount} {eventCount === 1 ? "Event" : "Events"}
                    </span>
                  </div>

                  <span className="text-emerald-600 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    View <RiArrowRightLine size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
