import React from "react";
import AdminLayout from "../components/AdminLayout";

export default function MinistriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout title="Ministries">
      <div className="bg-gray-50 p-6 md:p-8 min-h-full">
        <div className="max-w-6xl mx-auto">{children}</div>
      </div>
    </AdminLayout>
  );
}
