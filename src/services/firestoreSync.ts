import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  getDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Equipment, MovementRecord, HardwareChangeRecord } from '../types/equipment';
import { ServiceOrder } from '../types/serviceOrder';
import { SavedChecklistRecord, CompanyConfig } from '../types/checklist';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export type SyncStatus = 'connecting' | 'online' | 'syncing' | 'offline' | 'error';

// Demo IDs set to identify seed/test records
export const DEMO_EQUIPMENT_IDS = new Set(['eq_1', 'eq_2', 'eq_3', 'eq_4', 'eq_5']);
export const DEMO_SERVICE_ORDER_IDS = new Set(['os_101', 'os_102', 'os_103', 'os_104']);
export const DEMO_MOVEMENT_IDS = new Set(['mov_1', 'mov_2', 'mov_3']);
export const DEMO_HARDWARE_IDS = new Set(['hw_1', 'hw_2']);

// -------------------------------------------------------------
// Initialization & One-Time Seeding Logic
// -------------------------------------------------------------
export async function checkAndInitializeDatabase(
  initialEquipments: Equipment[],
  initialOrders: ServiceOrder[],
  initialMovements: MovementRecord[],
  initialHardwareChanges: HardwareChangeRecord[]
): Promise<boolean> {
  const configDocRef = doc(db, 'system_config', 'init_state');
  try {
    const snap = await getDoc(configDocRef);
    if (snap.exists() && snap.data()?.initialized) {
      // Already initialized in the central Firestore database!
      // Do not re-seed demo data even if records are empty, respecting deletions.
      return true;
    }

    // First time ever: seed initial baseline to Firestore so both PC and mobile see the same data
    const batch = writeBatch(db);

    for (const eq of initialEquipments) {
      batch.set(doc(db, 'equipments', eq.id), eq);
    }
    for (const os of initialOrders) {
      batch.set(doc(db, 'service_orders', os.id), os);
    }
    for (const mov of initialMovements) {
      batch.set(doc(db, 'movements', mov.id), mov);
    }
    for (const hw of initialHardwareChanges) {
      batch.set(doc(db, 'hardware_changes', hw.id), hw);
    }

    batch.set(configDocRef, {
      initialized: true,
      seededAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    return true;
  } catch (err) {
    console.warn('Falha ao inicializar dados no Firestore (modo offline ou permissão)', err);
    return false;
  }
}

// -------------------------------------------------------------
// Real-time Subscriptions
// -------------------------------------------------------------
export function subscribeToEquipments(
  onData: (equipments: Equipment[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'equipments';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Equipment[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<Equipment, 'id'>) });
      });
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToServiceOrders(
  onData: (orders: ServiceOrder[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'service_orders';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: ServiceOrder[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<ServiceOrder, 'id'>) });
      });
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToMovements(
  onData: (movements: MovementRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'movements';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: MovementRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<MovementRecord, 'id'>) });
      });
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToHardwareChanges(
  onData: (changes: HardwareChangeRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'hardware_changes';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: HardwareChangeRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<HardwareChangeRecord, 'id'>) });
      });
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToChecklistRecords(
  onData: (records: SavedChecklistRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'checklist_records';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: SavedChecklistRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<SavedChecklistRecord, 'id'>) });
      });
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// -------------------------------------------------------------
// Direct Mutations (Write / Delete)
// -------------------------------------------------------------
export async function syncSaveEquipment(equipment: Equipment): Promise<void> {
  const path = `equipments/${equipment.id}`;
  try {
    await setDoc(doc(db, 'equipments', equipment.id), equipment, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteEquipment(id: string): Promise<void> {
  const path = `equipments/${id}`;
  try {
    await deleteDoc(doc(db, 'equipments', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncSaveServiceOrder(order: ServiceOrder): Promise<void> {
  const path = `service_orders/${order.id}`;
  try {
    await setDoc(doc(db, 'service_orders', order.id), order, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteServiceOrder(id: string): Promise<void> {
  const path = `service_orders/${id}`;
  try {
    await deleteDoc(doc(db, 'service_orders', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncSaveMovement(movement: MovementRecord): Promise<void> {
  const path = `movements/${movement.id}`;
  try {
    await setDoc(doc(db, 'movements', movement.id), movement, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteMovement(id: string): Promise<void> {
  const path = `movements/${id}`;
  try {
    await deleteDoc(doc(db, 'movements', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncSaveHardwareChange(change: HardwareChangeRecord): Promise<void> {
  const path = `hardware_changes/${change.id}`;
  try {
    await setDoc(doc(db, 'hardware_changes', change.id), change, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteHardwareChange(id: string): Promise<void> {
  const path = `hardware_changes/${id}`;
  try {
    await deleteDoc(doc(db, 'hardware_changes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncSaveChecklistRecord(record: SavedChecklistRecord): Promise<void> {
  const path = `checklist_records/${record.id}`;
  try {
    await setDoc(doc(db, 'checklist_records', record.id), record, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteChecklistRecord(id: string): Promise<void> {
  const path = `checklist_records/${id}`;
  try {
    await deleteDoc(doc(db, 'checklist_records', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Centralized Test Data Purge Function
// (Addresses User Request: "Exclusão e limpeza dos dados de teste")
// -------------------------------------------------------------
export async function purgeAllTestDataFromFirestore(): Promise<{
  deletedEquipments: number;
  deletedOrders: number;
  deletedMovements: number;
  deletedHardware: number;
}> {
  const batch = writeBatch(db);
  let deletedEquipments = 0;
  let deletedOrders = 0;
  let deletedMovements = 0;
  let deletedHardware = 0;

  // 1. Equipments with demo IDs or 'teste' / 'demo' in name/patrimonio
  const eqSnap = await getDocs(collection(db, 'equipments'));
  eqSnap.forEach((docSnap) => {
    const data = docSnap.data();
    const isDemoId = DEMO_EQUIPMENT_IDS.has(docSnap.id);
    const isTestName =
      data.nome?.toLowerCase().includes('teste') ||
      data.patrimonio?.toLowerCase().includes('teste') ||
      data.patrimonio?.toLowerCase().includes('demo');
    if (isDemoId || isTestName) {
      batch.delete(docSnap.ref);
      deletedEquipments++;
    }
  });

  // 2. Service orders with demo IDs or test references
  const osSnap = await getDocs(collection(db, 'service_orders'));
  osSnap.forEach((docSnap) => {
    const data = docSnap.data();
    const isDemoId = DEMO_SERVICE_ORDER_IDS.has(docSnap.id);
    const isTestOs =
      data.identificacao?.toLowerCase().includes('teste') ||
      data.defeitoRelatado?.toLowerCase().includes('teste') ||
      data.numeroOs?.toLowerCase().includes('teste');
    if (isDemoId || isTestOs) {
      batch.delete(docSnap.ref);
      deletedOrders++;
    }
  });

  // 3. Movements with demo IDs
  const movSnap = await getDocs(collection(db, 'movements'));
  movSnap.forEach((docSnap) => {
    if (DEMO_MOVEMENT_IDS.has(docSnap.id)) {
      batch.delete(docSnap.ref);
      deletedMovements++;
    }
  });

  // 4. Hardware changes with demo IDs
  const hwSnap = await getDocs(collection(db, 'hardware_changes'));
  hwSnap.forEach((docSnap) => {
    if (DEMO_HARDWARE_IDS.has(docSnap.id)) {
      batch.delete(docSnap.ref);
      deletedHardware++;
    }
  });

  // Mark the init_state so it NEVER re-seeds demo items
  batch.set(
    doc(db, 'system_config', 'init_state'),
    {
      initialized: true,
      lastPurgedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();

  // Clear local storage demo records if present
  try {
    localStorage.removeItem('it_equipments_v1');
    localStorage.removeItem('it_service_orders_v1');
    localStorage.removeItem('it_movements_v1');
    localStorage.removeItem('it_hardware_changes_v1');
  } catch {
    // ignore
  }

  return {
    deletedEquipments,
    deletedOrders,
    deletedMovements,
    deletedHardware,
  };
}
