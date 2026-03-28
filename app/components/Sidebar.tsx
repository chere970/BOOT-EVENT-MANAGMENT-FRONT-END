"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiDashboardLine,
  RiCalendarEventLine,
  RiFileList3Line,
  RiGroupLine,
  RiMessage3Line,
  RiSettings4Line,
  RiMenuLine,
} from "react-icons/ri";

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-200 h-full flex flex-col bg-white">
      {/* Logo Area */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 text-white p-1.5 rounded-md">
            <RiMenuLine size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-gray-900">
              Eventra
            </h1>
            <p className="text-xs text-gray-500 font-medium">Admin Panel</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <RiMenuLine size={20} />
        </button>
      </div>

      {/* User Profile */}
      <div className="px-4 py-2">
        <div className="px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center space-x-3">
            <img
              src="https://randomuser.me/api/portraits/women/44.jpg"
              alt="User"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Ava Sinclair
              </h2>
              <p className="text-xs text-gray-500">Event Manager</p>
            </div>
          </div>
          <div className="text-gray-400">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="8 9 12 5 16 9"></polyline>
              <polyline points="16 15 12 19 8 15"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 mt-6">
        <p className="text-xs font-semibold text-gray-400 mb-4 tracking-wider">
          MAIN MENU
        </p>
        <nav className="space-y-1">
          <Link
            href="#"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RiDashboardLine size={20} />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>

          <Link
            href="/events"
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors ${pathname === "/events" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <div className="flex items-center space-x-3">
              <RiCalendarEventLine size={20} />
              <span className="text-sm">Browse Events</span>
            </div>
            {pathname === "/events" && (
              <span className="text-xs font-semibold bg-white text-gray-600 py-0.5 px-2 rounded-full border border-gray-200">
                4
              </span>
            )}
          </Link>

          <Link
            href="#"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${pathname.startsWith("/event-detail") ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <RiFileList3Line size={20} />
            <span className="text-sm">Event Details</span>
          </Link>

          <Link
            href="#"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RiGroupLine size={20} />
            <span className="text-sm font-medium">Attendee Insights</span>
          </Link>

          <Link
            href="#"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <RiMessage3Line size={20} />
              <span className="text-sm font-medium">Messages</span>
            </div>
            <span className="text-[10px] font-bold bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full">
              4
            </span>
          </Link>

          <Link
            href="#"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mt-8"
          >
            <RiSettings4Line size={20} />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
