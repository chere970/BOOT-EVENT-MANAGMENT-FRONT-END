"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetchJson } from "@/lib/api";
import {
  RiHandCoinLine,
  RiHeart3Line,
  RiCheckLine,
  RiHistoryLine,
  RiShieldCheckLine,
} from "react-icons/ri";

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function GivePage() {
  const { user } = useAuth();

  const [amount, setAmount] = useState<string>("100");
  const [currency, setCurrency] = useState<string>("ETB");
  const [frequency, setFrequency] = useState<string>("ONE_TIME");
  const [campaign, setCampaign] = useState<string>("General Fund");

  // Guest donor details (only asked when user is NOT logged in)
  const [donorName, setDonorName] = useState<string>("");
  const [donorEmail, setDonorEmail] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid donation amount.");
      return;
    }

    // Build payload according to specifications:
    // If logged in, omit donorName/donorEmail so backend attaches account automatically
    const payload: Record<string, any> = {
      amount: parsedAmount,
      currency,
      frequency,
      campaign: campaign.trim() || undefined,
    };

    if (!user) {
      if (!donorName.trim() || !donorEmail.trim()) {
        setError("Please provide your name and email for guest donation.");
        return;
      }
      payload.donorName = donorName.trim();
      payload.donorEmail = donorEmail.trim();
    }

    setSubmitting(true);

    try {
      const responseData = await apiFetchJson<{
        redirectUrl?: string;
        donationId?: string;
        [key: string]: any;
      }>("/giving/donate", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Redirect if redirectUrl is returned (future gateway integration)
      if (responseData && responseData.redirectUrl) {
        window.location.href = responseData.redirectUrl;
      } else {
        // Show success message directly (current mock behavior)
        setSuccessMessage("Thank you for your generous gift! Your donation has been recorded.");
        setAmount("50");
        setDonorName("");
        setDonorEmail("");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to process donation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <RiHandCoinLine size={32} className="text-purple-200" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Support Our Mission
            </h1>
          </div>
          <p className="text-purple-100 max-w-xl text-sm md:text-base leading-relaxed">
            Your generous giving enables us to serve our community, host impactful events, and support global missions.
          </p>
        </div>

        {user && (
          <Link
            href="/give/history"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 transition shrink-0"
          >
            <RiHistoryLine size={18} />
            <span>My Donation History</span>
          </Link>
        )}
      </div>

      {/* Main Donation Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
        {successMessage ? (
          <div className="p-8 bg-emerald-50 rounded-2xl border border-emerald-100 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              <RiCheckLine size={32} />
            </div>
            <h2 className="text-xl font-bold text-emerald-900">Donation Successful!</h2>
            <p className="text-emerald-700 max-w-md mx-auto text-sm leading-relaxed">
              {successMessage}
            </p>
            <div className="pt-2">
              <button
                onClick={() => setSuccessMessage(null)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition"
              >
                Make Another Gift
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            {/* Campaign Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Select Fund / Campaign
              </label>
              <select
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-purple-600 focus:bg-white transition"
              >
                <option value="General Fund">General Operating Fund</option>
                <option value="Building Fund">Building & Expansion Fund</option>
                <option value="Missions">Missions & Outreach</option>
                <option value="Youth & Kids">Youth & Children Ministries</option>
              </select>
            </div>

            {/* Frequency Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Frequency
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "ONE_TIME", label: "One-Time" },
                  { id: "MONTHLY", label: "Monthly" },
                  { id: "WEEKLY", label: "Weekly" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFrequency(f.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                      frequency === f.id
                        ? "bg-purple-50 text-purple-700 border-purple-600 shadow-xs"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset & Custom Amount */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Select Amount
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val.toString())}
                    className={`py-2.5 px-2 rounded-xl text-sm font-bold border transition ${
                      amount === val.toString()
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-purple-50 hover:text-purple-700"
                    }`}
                  >
                    {currency === "ETB" ? "Br " : "$"}{val}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">
                    {currency}
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Custom amount"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-base font-bold text-gray-900 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    required
                  />
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-purple-600"
                >
                  <option value="ETB">ETB (Birr)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>
            </div>

            {/* Guest Donor Info (Only if not logged in) */}
            {!user ? (
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                <h3 className="text-sm font-bold text-gray-900">
                  Donor Information (Guest)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Full Name</label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Email Address</label>
                    <input
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-800 flex items-center justify-between">
                <span>
                  Giving as logged-in user: <strong>{user.fullName || user.name || user.email}</strong>
                </span>
                <span className="font-semibold text-purple-600">Account Linked</span>
              </div>
            )}

            {/* Security note */}
            <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
              <RiShieldCheckLine size={16} className="text-emerald-600" />
              <span>Secure transaction. Payment details handled externally.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <RiHeart3Line size={20} />
              <span>{submitting ? "Processing..." : `Give $${amount || "0"} Now`}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
