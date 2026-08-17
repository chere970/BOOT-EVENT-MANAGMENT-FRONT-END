"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  RiCheckLine,
  RiCloseLine,
  RiLoader4Line,
  RiHeart3Line,
} from "react-icons/ri";

export default function DonationCallbackPage() {
  const searchParams = useSearchParams();
  const donationId = searchParams.get("donationId");

  const [status, setStatus] = useState<"PENDING" | "COMPLETED" | "FAILED">("PENDING");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!donationId) {
      setLoading(false);
      setErrorMessage("No donation ID provided in URL.");
      return;
    }

    let attempts = 0;
    const maxAttempts = 8; // ~16 seconds total max
    let timer: NodeJS.Timeout;

    const pollStatus = async () => {
      attempts++;
      try {
        const res = await apiFetch(`/giving/${donationId}`);
        if (res.ok) {
          const data = await res.json();
          const currentStatus = data?.status || "PENDING";
          if (currentStatus !== "PENDING") {
            setStatus(currentStatus);
            setLoading(false);
            return;
          }
        }
      } catch (err: any) {
        console.error("Polling error:", err);
      }

      if (attempts >= maxAttempts) {
        setLoading(false);
        setStatus("FAILED");
        setErrorMessage("Verification timed out. Please check your donation history or email receipt.");
      } else {
        timer = setTimeout(pollStatus, 2000);
      }
    };

    pollStatus();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [donationId]);

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center max-w-lg mx-auto my-12 space-y-6">
      {loading ? (
        <div className="space-y-4 py-8">
          <RiLoader4Line size={48} className="mx-auto text-purple-600 animate-spin" />
          <h2 className="text-xl font-bold text-gray-900">Verifying Your Donation...</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Please wait while we confirm your payment details. Do not close this window.
          </p>
        </div>
      ) : status === "COMPLETED" ? (
        <div className="space-y-4 py-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            <RiCheckLine size={36} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Donation Confirmed!</h2>
          <p className="text-sm text-gray-600 max-w-sm mx-auto">
            Thank you for your generosity! Your donation has been completed successfully.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/give"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl transition"
            >
              Back to Giving
            </Link>
            <Link
              href="/give/history"
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition"
            >
              View History
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4 py-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            <RiCloseLine size={36} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Donation Verification Failed</h2>
          <p className="text-sm text-red-600 max-w-sm mx-auto">
            {errorMessage || "We could not verify your payment status at this time."}
          </p>
          <div className="pt-4">
            <Link
              href="/give"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl transition"
            >
              <RiHeart3Line size={18} />
              <span>Try Again</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
