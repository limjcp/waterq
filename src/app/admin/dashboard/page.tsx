"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type CounterStats = {
  id: string;
  name: string;
  todayServed: number;
  totalServed: number;
  averageServiceTime: number;
  todayAverageServiceTime: number;
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<CounterStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounterStats() {
      try {
        const res = await fetch('/api/counters/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching counter stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCounterStats();
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
    );
  }

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return (
    <div className="min-h-screen bg-white p-8 transition-all duration-300">
      <h1 className="text-3xl font-bold text-sky-800 mb-6">Counter Statistics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((counter) => (
          <div key={counter.id} className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-sky-800 mb-3">{counter.name}</h3>
            <div className="space-y-3">
              {/* Today's Stats */}
              <div className="bg-white rounded-lg p-3">
                <h4 className="text-sm font-medium text-sky-600 mb-2">Today's Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sky-600">Served:</span>
                    <span className="font-semibold">{counter.todayServed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sky-600">Avg. Time:</span>
                    <span className="font-semibold">{formatTime(counter.todayAverageServiceTime)}</span>
                  </div>
                </div>
              </div>
              
              {/* All-time Stats */}
              <div className="bg-white rounded-lg p-3">
                <h4 className="text-sm font-medium text-sky-600 mb-2">All-time Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sky-600">Total Served:</span>
                    <span className="font-semibold">{counter.totalServed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sky-600">Avg. Time:</span>
                    <span className="font-semibold">{formatTime(counter.averageServiceTime)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
