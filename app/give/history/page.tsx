"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  RiArrowLeftLine,
  RiHandCoinLine,
  RiTimeLine,
  RiCheckLine,
  RiCloseLine,
  RiLoader4Line,
} from "react-icons/ri";

export interface DonationRecord {
  id: string;
  amount: number | string;
  currency?: string;
  frequency?: string;
  campaign?: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  donorName?: string;
  donorEmail?: string;
  createdAt: string;
}

export default function DonationHistoryPage() {
  const { user, token } = useAuth();

  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await apiFetch("/giving/history");
        if (!res.ok) {
          throw new Error("Failed to fetch donation history");
        }
        const data = await res.json();
        const list: DonationRecord[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setDonations(list);
      } catch (err: any) {
        setError(err?.message || "Failed to load donation history.");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [token]);

  const renderStatusBadge = (status: DonationRecord["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <RiCheckLine size={14} /> Completed
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <RiLoader4Line size={14} className="animate-spin" /> Pending
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
            <RiCloseLine size={14} /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      <Link
        href="/give"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:text-purple-900 transition-colors"
      >
        <RiArrowLeftLine size={18} /> Back to Giving Page
      </Link>

      <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <RiHandCoinLine className="text-purple-600" />
              <span>Donation History</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View all past contributions associated with your account.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 rounded-full">
            {donations.length} Total
          </span>
        </div>

        {!token ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-3">Please sign in to view your donation history.</p>
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition"
            >
              Sign In
            </Link>
          </div>
        ) : loading ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-gray-500 font-medium animate-pulse">Loading history...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 rounded-xl text-center">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        ) : donations.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-xl space-y-3">
            <RiHandCoinLine size={40} className="mx-auto text-gray-300" />
            <h3 className="text-base font-bold text-gray-800">No donations found</h3>
            <p className="text-sm text-gray-500">You haven't made any donations yet.</p>
            <div className="pt-2">
              <Link
                href="/give"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition"
              >
                Make a Gift
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {donations.map((item) => {
              const formattedDate = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Unknown date";

              const currSymbol = item.currency === "EUR" ? "€ font-sans" : item.currency === "GBP" ? "£" : item.currency === "ETB" ? "Br " : "$";

              return (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 px-3 rounded-xl transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-extrabold text-gray-900">
                        {currSymbol}{Number(item.amount).toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {item.frequency || "ONE_TIME"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Fund: <strong>{item.campaign || "General Fund"}</strong></span>
                      <span className="flex items-center gap-1">
                        <RiTimeLine size={12} /> {formattedDate}
                      </span>
                    </div>
                  </div>

                  <div>{renderStatusBadge(item.status)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
