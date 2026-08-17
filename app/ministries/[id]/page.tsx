"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiFetchJson } from "@/lib/api";
import {
  RiArrowLeftLine,
  RiGroupLine,
  RiCalendarEventLine,
  RiUserAddLine,
  RiDeleteBin6Line,
  RiMailSendLine,
  RiShieldUserLine,
  RiSearchLine,
  RiInformationLine,
} from "react-icons/ri";

export interface MinistryMember {
  id?: string;
  userId: string;
  role?: string;
  user?: {
    id?: string;
    fullName?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  fullName?: string;
  name?: string;
}

export interface MinistryDetail {
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
  members?: MinistryMember[];
  events?: any[];
}

export interface UserOption {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export default function MinistryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const ministryId = resolvedParams.id;
  const router = useRouter();

  const { user } = useAuth();
  const isAdmin = (user?.role || user?.userRole || "").toString().toUpperCase() === "ADMIN";

  const [ministry, setMinistry] = useState<MinistryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin Roster Management State
  const [selectedUserId, setSelectedUserId] = useState("");
  const [memberRole, setMemberRole] = useState("MEMBER");
  const [addingMember, setAddingMember] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [rosterSuccess, setRosterSuccess] = useState<string | null>(null);

  // User search/picker state
  const [userQuery, setUserQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserOption[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const fetchMinistryDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/ministries/${ministryId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch ministry details");
      }
      const data = await res.json();
      setMinistry(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load ministry details.");
    } finally {
      setLoading(false);
    }
  }, [ministryId]);

  useEffect(() => {
    fetchMinistryDetail();
  }, [fetchMinistryDetail]);

  // Search users for admin roster picker
  useEffect(() => {
    if (!isAdmin || !userQuery.trim()) {
      setUserSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        // Try standard user query endpoints
        const res = await apiFetch(`/user?search=${encodeURIComponent(userQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
          setUserSearchResults(list);
        }
      } catch {
        // Search API might not exist or error, keep query typed as ID fallback
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userQuery, isAdmin]);

  // Handle Add Member to Roster (ADMIN only)
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const userIdToAdd = selectedUserId.trim() || userQuery.trim();
    if (!userIdToAdd) {
      setRosterError("Please select or enter a valid User ID");
      return;
    }

    setAddingMember(true);
    setRosterError(null);
    setRosterSuccess(null);

    try {
      await apiFetchJson(`/ministries/${ministryId}/members`, {
        method: "POST",
        body: JSON.stringify({
          userId: userIdToAdd,
          role: memberRole,
        }),
      });

      setRosterSuccess("Member added to roster successfully.");
      setSelectedUserId("");
      setUserQuery("");
      fetchMinistryDetail();
    } catch (err: any) {
      setRosterError(err?.message || "Failed to add member to roster.");
    } finally {
      setAddingMember(false);
    }
  };

  // Handle Remove Member from Roster (ADMIN only)
  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm("Are you sure you want to remove this member from the roster?")) return;

    setRosterError(null);
    setRosterSuccess(null);

    try {
      const res = await apiFetch(`/ministries/${ministryId}/members/${targetUserId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to remove member");
      }

      setRosterSuccess("Member removed from roster.");
      // Update local state
      setMinistry((prev) => {
        if (!prev) return prev;
        const updatedMembers = (prev.members || []).filter(
          (m) => String(m.userId) !== String(targetUserId) && String(m.user?.id) !== String(targetUserId)
        );
        return {
          ...prev,
          members: updatedMembers,
          memberCount: Math.max(0, (prev.memberCount || updatedMembers.length + 1) - 1),
        };
      });
    } catch (err: any) {
      setRosterError(err?.message || "Failed to remove member.");
    }
  };

  const getMemberDisplayName = (m: MinistryMember): string => {
    return (
      m.user?.fullName ||
      m.user?.name ||
      m.fullName ||
      m.name ||
      "Ministry Member"
    );
  };

  const memberCount =
    ministry?.memberCount ??
    ministry?.membersCount ??
    ministry?._count?.members ??
    ministry?.members?.length ??
    0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-white rounded-2xl border border-gray-100">
        <p className="text-gray-500 font-medium animate-pulse">Loading ministry details...</p>
      </div>
    );
  }

  if (error || !ministry) {
    return (
      <div className="space-y-4">
        <Link
          href="/ministries"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <RiArrowLeftLine size={18} /> Back to Ministries
        </Link>
        <div className="p-8 bg-red-50 rounded-2xl border border-red-100 text-center">
          <p className="text-red-600 font-medium">{error || "Ministry not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link
        href="/ministries"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
      >
        <RiArrowLeftLine size={18} /> Back to Ministries List
      </Link>

      {/* Main Header Info */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-2xl">
              {ministry.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                {ministry.name}
              </h1>
              <p className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                <RiGroupLine size={14} /> {memberCount} {memberCount === 1 ? "Active Member" : "Active Members"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
            About this Ministry
          </h2>
          <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
            {ministry.description || "No description provided for this ministry."}
          </p>
        </div>

        {/* Contact to Join Callout (No self-service Join button per requirements) */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-3">
          <RiInformationLine size={24} className="text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h3 className="font-bold text-emerald-900">Interested in joining {ministry.name}?</h3>
            <p className="text-emerald-800 mt-1">
              Contact our ministry leaders or church administration to get involved in our upcoming events and meetings.
            </p>
          </div>
        </div>
      </div>

      {/* Member Roster View */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <RiGroupLine className="text-emerald-600" />
            <span>Ministry Members</span>
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">
            {ministry.members?.length || 0} Listed
          </span>
        </div>

        {/* Roster list - NAME ONLY (email/phone hidden per security requirement) */}
        {(!ministry.members || ministry.members.length === 0) ? (
          <p className="text-sm text-gray-500 italic py-4">No members currently listed in this ministry.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ministry.members.map((member, index) => {
              const displayName = getMemberDisplayName(member);
              const targetUserId = member.userId || member.user?.id || member.id;

              return (
                <div
                  key={targetUserId || index}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      {/* Name only, email and phone stripped */}
                      <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                      {member.role && (
                        <p className="text-[11px] font-semibold text-gray-500 uppercase">{member.role}</p>
                      )}
                    </div>
                  </div>

                  {isAdmin && targetUserId && (
                    <button
                      onClick={() => handleRemoveMember(String(targetUserId))}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition shrink-0"
                      title="Remove member from roster"
                    >
                      <RiDeleteBin6Line size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ADMIN Roster Management Panel */}
        {isAdmin && (
          <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
            <div className="flex items-center gap-2">
              <RiShieldUserLine size={20} className="text-indigo-600" />
              <h3 className="text-base font-bold text-gray-900">
                Admin Roster Management
              </h3>
            </div>

            {rosterError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                {rosterError}
              </div>
            )}
            {rosterSuccess && (
              <div className="p-3 text-sm text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-100">
                {rosterSuccess}
              </div>
            )}

            <form onSubmit={handleAddMember} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Search User / User ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={userQuery}
                      onChange={(e) => {
                        setUserQuery(e.target.value);
                        setSelectedUserId(e.target.value);
                      }}
                      placeholder="Enter raw User ID or search by name/phone..."
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
                    />
                    {userSearchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                        {userSearchResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUserId(u.id);
                              setUserQuery(u.fullName || u.name || u.id);
                              setUserSearchResults([]);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 border-b border-gray-100 last:border-0 flex justify-between"
                          >
                            <span className="font-bold text-gray-800">{u.fullName || u.name}</span>
                            <span className="text-gray-400">{u.id}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Role
                  </label>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="LEADER">Leader</option>
                    <option value="COORDINATOR">Coordinator</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={addingMember || (!selectedUserId.trim() && !userQuery.trim())}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition disabled:opacity-50"
              >
                <RiUserAddLine size={16} />
                <span>{addingMember ? "Adding..." : "Add Member to Roster"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
