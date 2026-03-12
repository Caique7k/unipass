"use client";

import { User } from "../contexts/AuthContext";
import { Moon, Sun, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";

interface TopbarProps {
  user: User | null;
}

export default function Topbar({ user }: TopbarProps) {
  const { logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  function toggleTheme() {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }

  return (
    <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow">
      <button
        onClick={toggleTheme}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="flex items-center gap-4">
        {user && <span className="font-medium">{user.name}</span>}
        <button
          onClick={logout}
          className="flex items-center gap-1 text-red-500 hover:opacity-80"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}
