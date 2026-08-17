"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetchJson, apiFetch } from "@/lib/api";
import {
  RiHeartPulseLine,
  RiHeartPulseFill,
  RiDeleteBin6Line,
  RiLock2Line,
  RiGlobalLine,
  RiSendPlane2Line,
  RiTimeLine,
  RiUser3Line,
} from "react-icons/ri";

export interface PrayerRequest {
  id: string;
  content: string;
  visibility?: "PUBLIC" | "PASTORAL_ONLY";
  prayCount?: number;
  praysCount?: number;
  count?: number;
  _count?: {
    prays?: number;
    prayers?: number;
  };
  userId?: string;
  createdById?: string;
  user?: {
    id?: string;
    fullName?: string;
    name?: string;
    email?: string;
  };
  authorName?: string;
  createdAt: string;
  updatedAt?: string;
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 30) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

export default function PrayerWallPage() {
  const { user, token } = useAuth();
  const isAdmin = (user?.role || user?.userRole || "").toString().toUpperCase() === "ADMIN";
  const currentUserId = user?.id || user?.userId || user?.sub;

  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state for ADMIN users: "ALL", "PUBLIC", "PASTORAL_ONLY"
  const [adminFilter, setAdminFilter] = useState<"ALL" | "PUBLIC" | "PASTORAL_ONLY">("ALL");

  // Form states
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PASTORAL_ONLY">("PUBLIC");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Optimistic tracking for praying IDs in session
  const [prayedIds, setPrayedIds] = useState<Record<string, boolean>>({});

  const fetchPrayerRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = "/prayer-requests";
      if (isAdmin && adminFilter !== "ALL") {
        url += `?visibility=${adminFilter}`;
      }
      const res = await apiFetch(url);
      if (!res.ok) {
        throw new Error("Failed to load prayer requests");
      }
      const data = await res.json();
      const list: PrayerRequest[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setRequests(list);
    } catch (err: any) {
      setError(err?.message || "Failed to load prayer requests.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, adminFilter]);

  useEffect(() => {
    fetchPrayerRequests();
  }, [fetchPrayerRequests]);

  // Create prayer request submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!token) {
      setSubmitError("You must be logged in to submit a prayer request.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const created = await apiFetchJson<PrayerRequest>("/prayer-requests", {
        method: "POST",
        body: JSON.stringify({
          content: content.trim(),
          visibility,
        }),
      });

      setContent("");
      setVisibility("PUBLIC");
      // Add newly created request to top of list
      setRequests((prev) => [created, ...prev]);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit prayer request.");
    } finally {
      setSubmitting(false);
    }
  };

  // Optimistic pray handler
  const handlePray = async (id: string) => {
    if (!token) {
      alert("Please log in to pray for this request.");
      return;
    }

    // Optimistically update
    const hasPrayed = !!prayedIds[id];
    setPrayedIds((prev) => ({ ...prev, [id]: !hasPrayed }));
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id === id) {
          const currentCount =
            req.prayCount ?? req.praysCount ?? req.count ?? req._count?.prays ?? 0;
          const nextCount = hasPrayed ? Math.max(0, currentCount - 1) : currentCount + 1;
          return {
            ...req,
            prayCount: nextCount,
          };
        }
        return req;
      })
    );

    try {
      await apiFetchJson(`/prayer-requests/${id}/pray`, {
        method: "PATCH",
      });
    } catch (err: any) {
      // Revert optimism on error
      setPrayedIds((prev) => ({ ...prev, [id]: hasPrayed }));
      setRequests((prev) =>
        prev.map((req) => {
          if (req.id === id) {
            const currentCount =
              req.prayCount ?? req.praysCount ?? req.count ?? req._count?.prays ?? 0;
            const revertedCount = hasPrayed ? currentCount + 1 : Math.max(0, currentCount - 1);
            return { ...req, prayCount: revertedCount };
          }
          return req;
        })
      );
      console.error("Pray error:", err);
    }
  };

  // Delete prayer request handler
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prayer request?")) return;

    // Optimistically remove card
    const previous = requests;
    setRequests((prev) => prev.filter((r) => r.id !== id));

    try {
      const res = await apiFetch(`/prayer-requests/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete request.");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete request.");
      setRequests(previous);
    }
  };

  const getPrayCount = (req: PrayerRequest): number => {
    return req.prayCount ?? req.praysCount ?? req.count ?? req._count?.prays ?? 0;
  };

  const canDelete = (req: PrayerRequest): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    const reqOwnerId = req.userId || req.createdById || req.user?.id;
    return String(reqOwnerId) === String(currentUserId);
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex items-center space-x-3 mb-2">
          <RiHeartPulseLine size={32} className="text-blue-200 animate-pulse" />
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Community Prayer Wall
          </h1>
        </div>
        <p className="text-blue-100 max-w-2xl text-sm md:text-base leading-relaxed">
          Share your prayer requests, lift up others in prayer, and stay connected with our community.
        </p>
      </div>

      {/* Composer Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>Share a Prayer Request</span>
        </h2>

        {token ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What is on your heart today? Describe your prayer request..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm resize-none transition-all"
              required
            />

            {submitError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                {submitError}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-gray-100">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Visibility:
                </span>
                <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setVisibility("PUBLIC")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      visibility === "PUBLIC"
                        ? "bg-white text-blue-600 shadow-xs font-semibold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <RiGlobalLine size={14} />
                    <span>Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("PASTORAL_ONLY")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      visibility === "PASTORAL_ONLY"
                        ? "bg-amber-50 text-amber-700 shadow-xs font-semibold border border-amber-200"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <RiLock2Line size={14} />
                    <span>Pastoral Only</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
              >
                {submitting ? (
                  <span>Posting...</span>
                ) : (
                  <>
                    <RiSendPlane2Line size={16} />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Please sign in to post prayer requests or support others in prayer.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* Admin Filter Controls */}
      {isAdmin && (
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-indigo-600 tracking-wider">
              Admin View Filter:
            </span>
          </div>
          <div className="flex gap-2">
            {(["ALL", "PUBLIC", "PASTORAL_ONLY"] as const).map((filterVal) => (
              <button
                key={filterVal}
                onClick={() => setAdminFilter(filterVal)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  adminFilter === filterVal
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {filterVal === "ALL" ? "All Requests" : filterVal === "PUBLIC" ? "Public" : "Pastoral Only"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feed Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center justify-between">
          <span>Prayer Requests</span>
          <span className="text-xs font-medium text-gray-500">
            {requests.length} {requests.length === 1 ? "request" : "requests"}
          </span>
        </h2>

        {loading ? (
          <div className="flex h-48 items-center justify-center bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500 font-medium animate-pulse">Loading prayer requests...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
            <p className="text-red-600 font-medium text-sm mb-2">{error}</p>
            <button
              onClick={fetchPrayerRequests}
              className="text-xs text-red-700 font-semibold underline hover:text-red-800"
            >
              Try Again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-100">
            <RiHeartPulseLine size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-800">No prayer requests yet</h3>
            <p className="text-sm text-gray-500 mt-1">Be the first to share a prayer request with the community!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((req) => {
              const prayCount = getPrayCount(req);
              const isPrayed = prayedIds[req.id];
              const author =
                req.user?.fullName ||
                req.user?.name ||
                req.authorName ||
                "Anonymous";

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                        {author.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{author}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <RiTimeLine size={12} />
                            {formatRelativeTime(req.createdAt)}
                          </span>
                          {req.visibility === "PASTORAL_ONLY" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <RiLock2Line size={10} /> Pastoral Only
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {canDelete(req) && (
                      <button
                        onClick={() => handleDelete(req.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Delete prayer request"
                      >
                        <RiDeleteBin6Line size={18} />
                      </button>
                    )}
                  </div>

                  <p className="text-gray-800 text-sm md:text-base leading-relaxed whitespace-pre-line">
                    {req.content}
                  </p>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => handlePray(req.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isPrayed
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : "bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-600 border border-gray-200"
                      }`}
                    >
                      {isPrayed ? (
                        <RiHeartPulseFill size={18} className="text-rose-600" />
                      ) : (
                        <RiHeartPulseLine size={18} />
                      )}
                      <span>{prayCount > 0 ? `${prayCount} Praying` : "Pray"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
