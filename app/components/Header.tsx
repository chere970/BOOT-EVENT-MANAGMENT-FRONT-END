import React from "react";
import { RiNotification2Line, RiSearchLine } from "react-icons/ri";

const Header = ({ title }: { title: string }) => {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-white">
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>

      <div className="flex items-center space-x-3">
        <button className="p-2.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
          <RiNotification2Line size={18} />
        </button>
        <button className="p-2.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
          <RiSearchLine size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
