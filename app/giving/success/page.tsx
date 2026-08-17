"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  RiCheckLine,
  RiHeart3Line,
  RiHistoryLine,
  RiLoader4Line,
} from "react-icons/ri";

function SuccessContent() {
  const searchParams = useSearchParams();
  const txRef =
    searchParams.get("tx_ref") ||
    searchParams.get("trx_ref") ||
    searchParams.get("donationId");

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center max-w-lg mx-auto my-12 space-y-6">
      <div className="space-y-4 py-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
          <RiCheckLine size={36} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Donation Successful!</h2>
        <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
          Thank you for your generosity! Your payment via Chapa has been processed successfully and your gift is recorded.
        </p>

        {txRef && (
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs font-mono text-purple-700 max-w-xs mx-auto truncate">
            Ref: <strong>{txRef}</strong>
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/give"
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl transition inline-flex items-center justify-center gap-2"
          >
            <RiHeart3Line size={18} />
            <span>Make Another Gift</span>
          </Link>
          <Link
            href="/give/history"
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition inline-flex items-center justify-center gap-2"
          >
            <RiHistoryLine size={18} />
            <span>View History</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function GivingSuccessPageAlias() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center">
          <RiLoader4Line size={36} className="mx-auto text-purple-600 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
