'use client';

import { useEffect, useState } from 'react';
import { testDatabaseConnection } from '@/app/actions/test-db';

export default function TestDbPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function test() {
      setLoading(true);
      const res = await testDatabaseConnection();
      setResult(res);
      setLoading(false);
    }
    test();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Testing Database Connection...</h1>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      <pre className="bg-zinc-900 p-4 rounded-lg overflow-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
