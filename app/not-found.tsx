import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto text-3xl font-extrabold">
          404
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
          <p className="text-gray-500 text-sm mt-2">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/events"
            className="inline-block w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-200"
          >
            Back to Home / Events
          </Link>
        </div>
      </div>
    </div>
  );
}
