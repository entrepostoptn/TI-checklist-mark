import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SyncStatus, purgeAllTestDataFromFirestore } from '../services/firestoreSync';

interface SyncContextType {
  status: SyncStatus;
  isOnline: boolean;
  lastSyncTime: Date | null;
  errorMessage: string | null;
  purgeTestData: () => Promise<{
    deletedEquipments: number;
    deletedOrders: number;
    deletedMovements: number;
    deletedHardware: number;
  }>;
  setSyncStatus: (status: SyncStatus) => void;
  recordSyncSuccess: () => void;
  recordSyncError: (msg: string) => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<SyncStatus>('connecting');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listen to browser network online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatus('online');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const recordSyncSuccess = useCallback(() => {
    setStatus('online');
    setLastSyncTime(new Date());
    setErrorMessage(null);
  }, []);

  const recordSyncError = useCallback((msg: string) => {
    setStatus('error');
    setErrorMessage(msg);
  }, []);

  const purgeTestData = useCallback(async () => {
    setStatus('syncing');
    try {
      const result = await purgeAllTestDataFromFirestore();
      recordSyncSuccess();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      recordSyncError(msg);
      throw err;
    }
  }, [recordSyncSuccess, recordSyncError]);

  return (
    <SyncContext.Provider
      value={{
        status,
        isOnline,
        lastSyncTime,
        errorMessage,
        purgeTestData,
        setSyncStatus: setStatus,
        recordSyncSuccess,
        recordSyncError,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return ctx;
};
