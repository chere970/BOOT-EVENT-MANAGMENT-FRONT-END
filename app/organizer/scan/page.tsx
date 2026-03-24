"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Scanner } from "@yudiel/react-qr-scanner";
import styles from "./page.module.css";

interface Event {
  id: string;
  title: string;
  startDate: string;
}

export default function OrganizerScanPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [scanTicket, setScanTicket] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [useScanner, setUseScanner] = useState(false);
  
  const [result, setResult] = useState<{type: "success" | "error", title: string, message: string} | null>(null);

  // Load all events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:3000/event");
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (err) {
        console.error("Failed to load events", err);
      }
    };
    fetchEvents();
  }, []);

  const verifyTicket = async (ticket?: string, qrPayload?: string) => {
    setResult(null);

    // If we're verifying manually, make sure we have an event
    // The QR payload might already contain the eventId, but we'll enforce having the organizer select it for safety
    if (!selectedEventId) {
      setResult({ type: "error", title: "Missing Event", message: "Please select an event to verify tickets for."});
      setUseScanner(false);
      return;
    }

    if (!ticket && !qrPayload) {
      setResult({ type: "error", title: "Missing Ticket", message: "Please enter a valid ticket number."});
      return;
    }

    setIsVerifying(true);

    try {
      let bodyData: any = {};

      if (qrPayload) {
        bodyData = { 
          qrPayload, // send the raw decoded QR string
          eventId: selectedEventId, // append the selected event just incase the backend needs to override or validate
        };
      } else if (ticket) {
        // Step 1: Lookup the specific registration to get the registrationId using the manual typed ticket
        const regResponse = await fetch(`http://localhost:3000/registration/${selectedEventId}`);
        if (!regResponse.ok) throw new Error("Could not fetch registration list for this event.");
        
        const registrations = await regResponse.json();
        const match = registrations.find((r: any) => r.ticketNumber === ticket.trim().toUpperCase() || r.ticketNumber === ticket.trim());
        
        if (!match) {
          throw new Error(`The ticket number '${ticket}' is not registered under this event.`);
        }

        bodyData = {
          registrationId: match.id,
          ticketNumber: match.ticketNumber,
          eventId: selectedEventId
        };
      }

      // Step 2: Mark attendance successfully via the backend scan endpoint
      const scanResponse = await fetch("http://localhost:3000/registration/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });

      if (!scanResponse.ok) {
        const errData = await scanResponse.json().catch(() => ({}));
        throw new Error(errData.message || "Backend rejected the ticket verification. It may belond to another event or already be checked in.");
      }

      setResult({
        type: "success", 
        title: "Successfully Verified!", 
        message: `Ticket is valid. The attendee has been securely checked in and marked as PRESENT.`
      });
      setScanTicket(""); // Clear input on success
      setUseScanner(false);

    } catch (err: any) {
      setResult({ type: "error", title: "Verification Error", message: err.message });
      setUseScanner(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyTicket(scanTicket, undefined);
  };

  const handleScanSuccess = (scanResult: any) => {
    if (isVerifying) return; // Prevent double scanning
    
    // Support yudiel/react-qr-scanner v2 array signature vs v1 string signature
    const textValue = Array.isArray(scanResult) ? scanResult[0]?.rawValue : scanResult;
    
    if (textValue) {
      verifyTicket(undefined, textValue);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", padding: "40px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", marginBottom: "20px" }}>
        <Link href="/events" style={{ color: "#4f46e5", textDecoration: "none", display: "inline-flex", alignItems: "center", fontWeight: "500", gap: "6px" }}>
          ← Back to General Events
        </Link>
      </div>

      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Organizer Portal</h1>
          <p className={styles.subtitle}>Scan and verify attendee tickets securely</p>
        </div>

        <form onSubmit={handleManualVerify}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Select Event</label>
            <select 
              className={styles.select}
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">-- Choose an Event to Manage --</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title} ({new Date(event.startDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {!useScanner ? (
            <div className={styles.formGroup}>
              <label className={styles.label}>Ticket Number</label>
              <input 
                type="text" 
                className={`${styles.input} ${styles.ticketInput}`}
                placeholder="e.g. ABCD-1234"
                value={scanTicket}
                onChange={(e) => setScanTicket(e.target.value.toUpperCase())}
              />
              <div style={{ marginTop: "12px", textAlign: "center" }}>
                <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>OR</span>
                <button 
                  type="button"
                  onClick={() => setUseScanner(true)} 
                  style={{ display: "block", width: "100%", marginTop: "8px", padding: "12px", backgroundColor: "#e0e7ff", color: "#4f46e5", border: "1px solid #c7d2fe", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                >
                  📸 Open QR Scanner
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.formGroup} style={{ textAlign: "center" }}>
              <div style={{ borderRadius: "12px", overflow: "hidden", border: "2px solid #4f46e5", marginBottom: "16px", backgroundColor: "#000" }}>
                {/* Dynamically loads webcam */}
                <Scanner 
                  onScan={handleScanSuccess}
                  onError={(err) => console.log(err)}
                  components={{ zoom: true, finder: true }}
                />
              </div>
              <button 
                type="button"
                onClick={() => setUseScanner(false)} 
                style={{ backgroundColor: "#fee2e2", color: "#ef4444", border: "none", padding: "10px 20px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
              >
                Cancel Scanning
              </button>
            </div>
          )}

          {!useScanner && (
            <button 
              type="submit" 
              className={styles.verifyButton}
              disabled={isVerifying || events.length === 0}
            >
              {isVerifying ? "Verifying..." : "Verify & Check-In"}
            </button>
          )}
        </form>

        {result && (
          <div className={`${styles.resultBox} ${result.type === "success" ? styles.resultSuccess : styles.resultError}`}>
            <h3 className={styles.resultTitle}>
              {result.type === "success" ? "✅ " : "❌ "}
              {result.title}
            </h3>
            <p className={styles.resultMessage}>{result.message}</p>
          </div>
        )}

      </div>
    </div>
  );
}
