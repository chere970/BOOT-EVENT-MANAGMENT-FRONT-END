"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-orange-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
          !
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-500 text-sm mt-2">
            {error?.message || "An unexpected error occurred while loading this page."}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full py-3 px-6 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition"
          >
            Try Again
          </button>
          <Link
            href="/events"
            className="w-full py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
          >
            Go to Events
          </Link>
        </div>
      </div>
    </div>
  );
}
