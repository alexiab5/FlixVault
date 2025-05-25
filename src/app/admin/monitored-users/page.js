'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MonitoredUsersPage() {
  const [monitoredUsers, setMonitoredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchMonitoredUsers = async () => {
      try {
        const response = await fetch('/api/admin/monitored-users');
        if (!response.ok) {
          throw new Error('Failed to fetch monitored users');
        }
        const data = await response.json();
        setMonitoredUsers(data.monitoredUsers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMonitoredUsers();
      // Refresh data every 30 seconds
      const interval = setInterval(fetchMonitoredUsers, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="container mx-auto px-4 py-8 mt-16">
        <h1 className="text-2xl mb-6 text-gray-900">Monitored Users</h1>
        
        {monitoredUsers.length === 0 ? (
          <div className="bg-white rounded p-4 text-center">
            <p className="text-gray-600">No users are currently being monitored.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 border-b text-left text-sm font-medium text-gray-900">User</th>
                  <th className="px-6 py-3 border-b text-left text-sm font-medium text-gray-900">Email</th>
                  <th className="px-6 py-3 border-b text-left text-sm font-medium text-gray-900">Reason</th>
                  <th className="px-6 py-3 border-b text-left text-sm font-medium text-gray-900">Suspicious Actions</th>
                  <th className="px-6 py-3 border-b text-left text-sm font-medium text-gray-900">First Detected</th>
                  <th className="px-6 py-3 border-b text-left text-sm font-medium text-gray-900">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {monitoredUsers.map((monitored) => (
                  <tr key={monitored.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 border-b text-sm text-gray-900">{monitored.user.name}</td>
                    <td className="px-6 py-4 border-b text-sm text-gray-900">{monitored.user.email}</td>
                    <td className="px-6 py-4 border-b text-sm text-red-600">{monitored.reason}</td>
                    <td className="px-6 py-4 border-b text-sm text-gray-900">
                      <ul className="list-disc list-inside">
                        {(monitored.suspiciousActions?.actions || []).map((action, index) => (
                          <li key={index}>
                            {action.action} ({action.count} operations in {action.timeWindow}, threshold: {action.threshold})
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 border-b text-sm text-gray-900">{new Date(monitored.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 border-b text-sm text-gray-900">{new Date(monitored.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 