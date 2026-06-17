// src/components/providers/DatabaseProvider.tsx
'use client';

import { useEffect, useState, ReactNode } from 'react';
import db from '@/lib/IndexedDB/db';

interface DatabaseProviderProps {
  children: ReactNode;
}

export default function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initDb = async () => {
      try {
        await db.open();
        setIsReady(true);
      } catch (err) {
        console.error("Failed to open database:", err);
      }
    };

    initDb();
    
    return () => {
      db.close();
    };
  }, []);

  if (!isReady) {
    return <div>Initializing database...</div>;
  }

  return <>{children}</>;
}