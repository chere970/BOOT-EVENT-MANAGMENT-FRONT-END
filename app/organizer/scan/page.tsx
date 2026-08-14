"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import AdminLayout from "@/app/components/AdminLayout";

interface Event {
  id: string;
  title: string;
  startDate: string;
}

interface CurrentUser {
  role?: string;
  userRole?: string;
}

export default function OrganizerScanPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [scanTicket, setScanTicket] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [useScanner, setUseScanner] = useState(false);

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authToken, setAuthToken] = useState("");

  const [result, setResult] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      "";
    const rawUser = localStorage.getItem("user");

    if (!token || !rawUser) {
      router.push(`/login?next=${encodeURIComponent("/organizer/scan")}`);
      return;
    }

    try {
      const parsedUser: CurrentUser = JSON.parse(rawUser);
      const activeRole = (parsedUser.role || parsedUser.userRole || "")
        .toString()
        .toUpperCase();

      if (activeRole !== "VOLUNTEER") {
        router.push(activeRole === "MEMBER" ? "/member" : "/dashbord");
        return;
      }

      setAuthToken(token);
      setIsAuthorized(true);
    } catch (parseError) {
      console.error("Failed to parse user from localStorage:", parseError);
      router.push("/login");
      return;
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  // Load all events on mount
  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:3000/event", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (err) {
        console.error("Failed to load events", err);
      }
    };
    fetchEvents();
  }, [authToken, isAuthorized]);

  const verifyTicket = async (ticket?: string, qrPayload?: string) => {
    setResult(null);

    // If we're verifying manually, make sure we have an event
    // The QR payload might already contain the eventId, but we'll enforce having the organizer select it for safety
    if (!selectedEventId) {
      setResult({
        type: "error",
        title: "Missing Event",
        message: "Please select an event to verify tickets for.",
      });
      setUseScanner(false);
      return;
    }

    if (!ticket && !qrPayload) {
      setResult({
        type: "error",
        title: "Missing Ticket",
        message: "Please enter a valid ticket number.",
      });
      return;
    }

    setIsVerifying(true);

    try {
      let bodyData: any = {};
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      };

      if (qrPayload) {
        bodyData = {
          qrPayload, // send the raw decoded QR string
          eventId: selectedEventId, // append the selected event just incase the backend needs to override or validate
        };
      } else if (ticket) {
        // Step 1: Lookup the specific registration to get the registrationId using the manual typed ticket
        const regResponse = await fetch(
          `http://localhost:3000/registration/${selectedEventId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );
        if (!regResponse.ok)
          throw new Error("Could not fetch registration list for this event.");

        const registrations = await regResponse.json();
        const match = registrations.find(
          (r: any) =>
            r.ticketNumber === ticket.trim().toUpperCase() ||
            r.ticketNumber === ticket.trim(),
        );

        if (!match) {
          throw new Error(
            `The ticket number '${ticket}' is not registered under this event.`,
          );
        }

        bodyData = {
          registrationId: match.id,
          ticketNumber: match.ticketNumber,
          eventId: selectedEventId,
        };
      }

      // Step 2: Mark attendance successfully via the backend scan endpoint
      const scanResponse = await fetch(
        "http://localhost:3000/registration/scan",
        {
          method: "POST",
          headers,
          body: JSON.stringify(bodyData),
        },
      );

      if (!scanResponse.ok) {
        const errData = await scanResponse.json().catch(() => ({}));
        throw new Error(
          errData.message ||
            "Backend rejected the ticket verification. It may belong to another event or already be checked in.",
        );
      }

      setResult({
        type: "success",
        title: "Successfully Verified!",
        message: `Ticket is valid. The attendee has been securely checked in and marked as PRESENT.`,
      });
      setScanTicket(""); // Clear input on success
      setUseScanner(false);
    } catch (err: any) {
      setResult({
        type: "error",
        title: "Verification Error",
        message: err.message,
      });
      setUseScanner(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthorized || !authToken) {
      setResult({
        type: "error",
        title: "Unauthorized",
        message: "Only authenticated volunteers can scan tickets.",
      });
      return;
    }

    await verifyTicket(scanTicket, undefined);
  };

  const handleScanSuccess = (scanResult: any) => {
    if (isVerifying) return; // Prevent double scanning
    if (!isAuthorized || !authToken) return;

    // Support yudiel/react-qr-scanner v2 array signature vs v1 string signature
    const textValue = Array.isArray(scanResult)
      ? scanResult[0]?.rawValue
      : scanResult;

    if (textValue) {
      verifyTicket(undefined, textValue);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
        <div className="max-w-2xl w-full text-center">
          <p className="text-gray-500 font-medium">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    // <AdminLayout title="Organizer Scanner">
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto mb-6">
        <Link
          href="/events"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <span className="mr-2">←</span> Back to General Events
        </Link>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Organizer Portal
          </h1>
          <p className="text-gray-500 text-lg">
            Scan and verify attendee tickets securely
          </p>
        </div>

        <form onSubmit={handleManualVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Event
            </label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">-- Choose an Event to Manage --</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} (
                  {new Date(event.startDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {!useScanner ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ticket Number
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-mono text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm placeholder-gray-400"
                placeholder="e.g. ABCD-1234"
                value={scanTicket}
                onChange={(e) => setScanTicket(e.target.value.toUpperCase())}
              />
              <div className="mt-4 text-center">
                <span className="text-sm font-medium text-gray-400 block mb-3 uppercase tracking-wider">
                  OR
                </span>
                <button
                  type="button"
                  onClick={() => setUseScanner(true)}
                  className="w-full py-3 px-4 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl hover:bg-indigo-100 font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="text-xl">📸</span> Open QR Scanner
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center rounded-2xl bg-gray-50 p-4 border border-gray-100 shadow-inner">
              <div className="rounded-xl overflow-hidden border-2 border-indigo-500 mb-4 bg-black shadow-md aspect-square max-w-md mx-auto relative">
                <Scanner
                  onScan={handleScanSuccess}
                  onError={(err) => console.log(err)}
                  components={{ zoom: true, finder: true }}
                />
              </div>
              <button
                type="button"
                onClick={() => setUseScanner(false)}
                className="py-2.5 px-6 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 font-semibold transition-colors shadow-sm"
              >
                Cancel Scanning
              </button>
            </div>
          )}

          {!useScanner && (
            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:bg-gray-300 disabled:text-gray-500 transition-all transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed shadow-md"
              disabled={isVerifying || events.length === 0}
            >
              {isVerifying ? "Verifying..." : "Verify & Check-In"}
            </button>
          )}
        </form>

        {result && (
          <div
            className={`mt-8 p-6 rounded-xl border flex items-start gap-4 ${
              result.type === "success"
                ? "bg-green-50 border-green-200 text-green-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <div className="text-2xl mt-0.5">
              {result.type === "success" ? "✅" : "❌"}
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">{result.title}</h3>
              <p
                className={
                  result.type === "success" ? "text-green-800" : "text-red-800"
                }
              >
                {result.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    // </AdminLayout>
  );
}
