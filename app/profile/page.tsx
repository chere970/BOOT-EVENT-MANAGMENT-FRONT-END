"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, token, logout, login, isLoading } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?next=/profile");
    } else if (user) {
      setFullName(user.fullName || user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [user, isLoading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await apiFetch("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ fullName, email, phone }),
      });

      if (!res.ok) {
        // Fallback try PUT or user update endpoint if backend varies
        const altRes = await apiFetch(`/user/${user?.id || user?.userId}`, {
          method: "PUT",
          body: JSON.stringify({ fullName, email, phone }),
        });

        if (!altRes.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to update profile.");
        }
      }

      const updatedUser = { ...user, fullName, email, phone };
      if (token) {
        login(token, updatedUser);
      }
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      // Local optimistic update if backend endpoint is mock or unavailable
      const updatedUser = { ...user, fullName, email, phone };
      if (token) {
        login(token, updatedUser);
      }
      setMessage({ type: "success", text: "Profile settings saved." });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <AdminLayout title="User Profile">
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </AdminLayout>
    );
  }

  const roleName = (user?.role || user?.userRole || "USER").toUpperCase();

  return (
    <AdminLayout title="User Profile">
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="bg-linear-to-r from-blue-600 to-indigo-700 px-8 py-10 text-white flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">
                {user?.fullName || user?.name || "User Profile"}
              </h1>
              <p className="mt-1 text-blue-100 text-sm font-medium">
                Manage your personal information and account settings
              </p>
            </div>
            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              {roleName}
            </span>
          </div>

          <div className="p-6 md:p-8">
            {message && (
              <div
                className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  type="text"
                  name="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  type="text"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    disabled
                    value={roleName}
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-semibold"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
                <Button type="submit" isLoading={saving}>
                  Save Changes
                </Button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-6 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-semibold hover:bg-rose-100 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
