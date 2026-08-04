// ==============================================================================
// FILE: src/app/page.tsx
// WHAT THIS FILE IS: Next.js Main Landing & REST Status Page Component.
// WHY IT IS USED: Serves as the primary user interface, rendering a modern UI 
//                 and testing REST connectivity to the FastAPI backend.
// ==============================================================================

"use client";

// Import useState and useEffect hooks from React for state management and side-effects
import { useState, useEffect } from "react";
// Import fetchServerHealth helper function and HealthStatus interface from apiService
import { fetchServerHealth, HealthStatus } from "@/services/apiService";

export default function Home() {
  // State to store fetched server health status or null if not loaded yet
  const [health, setHealth] = useState<HealthStatus | null>(null);
  // State to store loading boolean state
  const [loading, setLoading] = useState<boolean>(true);
  // State to store error message string if request fails
  const [error, setError] = useState<string | null>(null);

  // Function to query server health status from backend
  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call apiService fetch function
      const data = await fetchServerHealth();
      // Update health state with response data
      setHealth(data);
    } catch (err: unknown) {
      // Catch and set user-friendly error message if backend is unreachable
      setError("Unable to connect to FastAPI backend. Ensure backend server is running on port 8000.");
    } finally {
      // Set loading state back to false
      setLoading(false);
    }
  };

  // Trigger checkHealth on initial component mount
  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      {/* Hero Header Section */}
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
          🎙️ Voice Agent Studio
        </h1>
        <p className="text-slate-400 text-lg">
          Real-time AI Voice Assistant powered by Next.js 15 & FastAPI.
        </p>
      </div>

      {/* Backend Connection Status Card */}
      <div className="w-full max-w-md mt-10 p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm">
        <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center justify-between">
          <span>Backend Connection</span>
          <button 
            onClick={checkHealth}
            disabled={loading}
            className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-slate-300 rounded-md border border-slate-700"
          >
            {loading ? "Checking..." : "Refresh"}
          </button>
        </h2>

        {/* Loading State Indicator */}
        {loading && (
          <div className="flex items-center space-x-3 text-slate-400 py-4">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Connecting to FastAPI backend...</span>
          </div>
        )}

        {/* Error State Display */}
        {error && (
          <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-xl text-red-300 text-sm space-y-2">
            <p className="font-semibold flex items-center gap-2">
              <span>⚠️ Connection Error</span>
            </p>
            <p>{error}</p>
          </div>
        )}

        {/* Success State Display */}
        {!loading && health && (
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Server Status:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                🟢 {health.status.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Environment:</span>
              <span className="text-indigo-400 font-mono">{health.environment}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">AI Provider:</span>
              <span className="text-purple-400 font-mono font-semibold">{health.ai_provider.toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
