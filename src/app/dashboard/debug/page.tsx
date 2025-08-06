"use client";
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

const SimpleDebug: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [manualResult, setManualResult] = useState<any>(null);

 

const myHeaders = new Headers();
myHeaders.append("Cookie", "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4MjcxMTcwLCJleHAiOjE3NDgyNzgzNzB9.L9xiaengQauYOPbUSKsW3XUNpenH5xEYEwGCohPwENM");

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow"
};

// Create headers with cookie
  const createHeaders = () => {
    const headers = new Headers();
    headers.append('Cookie', 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4MjcxMTcwLCJleHAiOjE3NDgyNzgzNzB9.L9xiaengQauYOPbUSKsW3XUNpenH5xEYEwGCohPwENM');
    headers.append('Content-Type', 'application/json');
    return headers;
  };


  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  // Modified useQuery implementation
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['test-query'],
    queryFn: async () => {
      addLog('React Query function called!');
      
      try {
        addLog('Testing fetch with cookie...');
        const response = await fetch('http://localhost:4700/api/admin/dashboard/statistics', {
          method: 'GET',
          headers: createHeaders(),
          credentials: 'include',
          redirect: 'follow'
        });
        
        addLog(`Fetch response status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        addLog(`Fetch success: ${JSON.stringify(data)}`);
        return data.data;
      } catch (err: any) {
        addLog(`Fetch error: ${err.message}`);
        throw err;
      }
    },
    retry: false,
  });

  const testManualFetch = async () => {
    try {
      addLog('Manual fetch test started');
      
      const response = await fetch('http://localhost:4700/api/admin/dashboard/statistics', {
        method: 'GET',
        headers: createHeaders(),
        credentials: 'include',
        redirect: 'follow'
      });
      
      addLog(`Manual fetch status: ${response.status}`);
      const result = await response.json();
      setManualResult(result);
      addLog(`Manual fetch result: ${JSON.stringify(result)}`);
    } catch (err: any) {
      addLog(`Manual fetch error: ${err.message}`);
      setManualResult({ error: err.message });
    }
  };

  useEffect(() => {
    addLog('Component mounted');
    addLog(`localStorage available: ${typeof localStorage !== 'undefined'}`);
    addLog(`Token in storage: ${!!localStorage.getItem('token')}`);
  }, []);

  useEffect(() => {
    addLog(`Query loading: ${isLoading}`);
    addLog(`Query error: ${isError}`);
    addLog(`Query data: ${data ? 'Has data' : 'No data'}`);
  }, [isLoading, isError, data]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Dashboard</h1>
        
        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${isLoading ? 'bg-yellow-100' : 'bg-gray-100'}`}>
            <div className="font-bold">Loading</div>
            <div className="text-2xl">{isLoading ? 'YES' : 'NO'}</div>
          </div>
          <div className={`p-4 rounded-lg ${isError ? 'bg-red-100' : 'bg-gray-100'}`}>
            <div className="font-bold">Error</div>
            <div className="text-2xl">{isError ? 'YES' : 'NO'}</div>
          </div>
          <div className={`p-4 rounded-lg ${data ? 'bg-green-100' : 'bg-gray-100'}`}>
            <div className="font-bold">Data</div>
            <div className="text-2xl">{data ? 'YES' : 'NO'}</div>
          </div>
        </div>

        {/* Manual Test Button */}
        <div className="mb-6">
          <button
            onClick={testManualFetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-4"
          >
            Test Manual Fetch
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Reload Page
          </button>
        </div>

        {/* Manual Result */}
        {manualResult && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h3 className="font-bold mb-2">Manual Fetch Result:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(manualResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Query Data */}
        {data && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h3 className="font-bold mb-2">Query Data:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}

        {/* Error Details */}
        {error && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
            <h3 className="font-bold text-red-800 mb-2">Error Details:</h3>
            <pre className="text-red-700 text-sm">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        {/* Debug Logs */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold mb-2">Debug Logs:</h3>
          <div className="bg-gray-100 p-2 rounded max-h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm text-gray-700 mb-1 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDebug;