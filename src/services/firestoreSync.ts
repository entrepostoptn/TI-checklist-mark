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
import { Client, Store } from '../types/client';
import { BranchUnit } from '../types/branch';
import { AuditLog } from '../types/audit';
import { ChecklistTemplate, BranchChecklist } from '../types/branchChecklist';
import { KnowledgeArticle } from '../types/knowledgeBase';
import { User } from '../types/auth';
import { RemoteAccess, RemoteAccessHistory } from '../types/remoteAccess';
import { CctvProject, CctvPermissionsConfig } from '../types/cctv';
import {
  INITIAL_PATA_NEGRA_BRANCHES,
  INITIAL_CHECKLIST_TEMPLATES,
  INITIAL_BRANCH_CHECKLISTS,
  INITIAL_AUDIT_LOGS,
} from '../constants/initialPataNegraData';
import { INITIAL_USERS, INITIAL_HASHES } from '../constants/initialAuthData';
import { INITIAL_ARTICLES } from '../constants/initialKnowledgeData';

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
// Universal Sanitizer for Firestore Writes
// Removes all undefined values recursively to avoid Firestore write errors.
// -------------------------------------------------------------
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === "object") {
    if (data instanceof Date) return data as any;
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        cleaned[key] = sanitizeForFirestore(val);
      }
    }
    return cleaned as any;
  }
  return data;
}

// Global synchronization event listeners
export type SyncNotificationCallback = (event: { collection: string; count: number; timestamp: Date }) => void;
const syncListeners = new Set<SyncNotificationCallback>();

export function addSyncListener(cb: SyncNotificationCallback): () => void {
  syncListeners.add(cb);
  return () => syncListeners.delete(cb);
}

export function notifySyncSuccess(collectionName: string, count: number = 1) {
  const payload = { collection: collectionName, count, timestamp: new Date() };
  syncListeners.forEach((cb) => {
    try {
      cb(payload);
    } catch {}
  });
}


// -------------------------------------------------------------
// Centralized Database Initialization & Seeding
// Runs once per database lifecycle; respects user deletions and modifications!
// -------------------------------------------------------------
export async function ensureGlobalDatabaseSeeded(
  initialEquipments?: Equipment[],
  initialOrders?: ServiceOrder[],
  initialMovements?: MovementRecord[],
  initialHardwareChanges?: HardwareChangeRecord[],
  initialClients?: Client[],
  initialStores?: Store[]
): Promise<boolean> {
  const seedDocRef = doc(db, 'system_config', 'global_seed_v4');
  try {
    const snap = await getDoc(seedDocRef);
    if (snap.exists() && snap.data()?.initialized) {
      // Already fully initialized across all collections in the central Firestore!
      return true;
    }

    console.log('[FirestoreSync] Realizando carga inicial global no Firestore...');

    // 1. Seed Branches (Matrizes e Filiais)
    const branchesSnap = await getDocs(collection(db, 'branches'));
    if (branchesSnap.empty) {
      const branchBatch = writeBatch(db);
      for (const branch of INITIAL_PATA_NEGRA_BRANCHES) {
        branchBatch.set(doc(db, 'branches', branch.id), sanitizeForFirestore(branch));
      }
      await branchBatch.commit();
    }

    // 2. Seed Checklist Templates & Checklists
    const tplSnap = await getDocs(collection(db, 'checklist_templates'));
    if (tplSnap.empty) {
      const tplBatch = writeBatch(db);
      for (const tpl of INITIAL_CHECKLIST_TEMPLATES) {
        tplBatch.set(doc(db, 'checklist_templates', tpl.id), sanitizeForFirestore(tpl));
      }
      for (const chk of INITIAL_BRANCH_CHECKLISTS) {
        tplBatch.set(doc(db, 'branch_checklists', chk.id), sanitizeForFirestore(chk));
      }
      await tplBatch.commit();
    }

    // 3. Seed Audit Logs
    const auditSnap = await getDocs(collection(db, 'audit_logs'));
    if (auditSnap.empty) {
      const auditBatch = writeBatch(db);
      for (const log of INITIAL_AUDIT_LOGS) {
        auditBatch.set(doc(db, 'audit_logs', log.id), sanitizeForFirestore(log));
      }
      await auditBatch.commit();
    }

    // 4. Seed Users and Credentials
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      const userBatch = writeBatch(db);
      for (const u of INITIAL_USERS) {
        userBatch.set(doc(db, 'users', u.id), sanitizeForFirestore(u));
      }
      userBatch.set(doc(db, 'system_config', 'auth_credentials'), {
        credentials: INITIAL_HASHES,
        updatedAt: serverTimestamp(),
      });
      await userBatch.commit();
    }

    // 5. Seed Knowledge Articles
    const articlesSnap = await getDocs(collection(db, 'knowledge_articles'));
    if (articlesSnap.empty) {
      const artBatch = writeBatch(db);
      for (const art of INITIAL_ARTICLES) {
        artBatch.set(doc(db, 'knowledge_articles', art.id), sanitizeForFirestore(art));
      }
      await artBatch.commit();
    }

    // 6. Seed Clients & Stores if provided and empty
    if (initialClients && initialClients.length > 0) {
      const clientsSnap = await getDocs(collection(db, 'clients'));
      if (clientsSnap.empty) {
        const cliBatch = writeBatch(db);
        for (const cli of initialClients) {
          cliBatch.set(doc(db, 'clients', cli.id), sanitizeForFirestore(cli));
        }
        await cliBatch.commit();
      }
    }

    if (initialStores && initialStores.length > 0) {
      const storesSnap = await getDocs(collection(db, 'stores'));
      if (storesSnap.empty) {
        const stBatch = writeBatch(db);
        for (const st of initialStores) {
          stBatch.set(doc(db, 'stores', st.id), sanitizeForFirestore(st));
        }
        await stBatch.commit();
      }
    }

    // 7. Seed Equipments, Orders, Movements, Hardware Changes if empty
    if (initialEquipments && initialEquipments.length > 0) {
      const eqSnap = await getDocs(collection(db, 'equipments'));
      if (eqSnap.empty) {
        const eqBatch = writeBatch(db);
        for (const eq of initialEquipments) {
          eqBatch.set(doc(db, 'equipments', eq.id), sanitizeForFirestore(eq));
          // If equipment has remote access info, also index into remote_access
          if (eq.anydeskId || eq.teamviewerId) {
            const remoteItem: RemoteAccess = {
              id: `ra_${eq.id}`,
              maquinaId: eq.id,
              nomeMaquina: eq.nome,
              lojaNome: eq.lojaNome || eq.lojaOrigem || 'Matriz',
              filialNome: eq.filialNome || eq.lojaNome || 'Matriz',
              caixaNumero: eq.numeroCaixa || eq.posicaoCaixa,
              patrimonio: eq.patrimonio,
              numeroSerie: eq.numeroSerie,
              appAcessoRemoto: eq.appAcessoRemoto || (eq.anydeskId ? 'AnyDesk' : 'TeamViewer'),
              anydeskId: eq.anydeskId || '',
              teamviewerId: eq.teamviewerId,
              status: eq.status === 'EM_USO' ? 'ativo' : 'em_manutencao',
              dataUltimaAtualizacao: eq.updatedAt || new Date().toISOString(),
              tecnicoResponsavel: eq.tecnicoResponsavel || 'Equipe TI',
              criadoEm: eq.createdAt || new Date().toISOString(),
              atualizadoEm: eq.updatedAt || new Date().toISOString(),
            };
            eqBatch.set(doc(db, 'remote_access', remoteItem.id), sanitizeForFirestore(remoteItem));
          }
        }
        await eqBatch.commit();
      }
    }

    if (initialOrders && initialOrders.length > 0) {
      const osSnap = await getDocs(collection(db, 'service_orders'));
      if (osSnap.empty) {
        const osBatch = writeBatch(db);
        for (const os of initialOrders) {
          osBatch.set(doc(db, 'service_orders', os.id), sanitizeForFirestore(os));
        }
        await osBatch.commit();
      }
    }

    if (initialMovements && initialMovements.length > 0) {
      const movSnap = await getDocs(collection(db, 'movements'));
      if (movSnap.empty) {
        const movBatch = writeBatch(db);
        for (const mov of initialMovements) {
          movBatch.set(doc(db, 'movements', mov.id), sanitizeForFirestore(mov));
        }
        await movBatch.commit();
      }
    }

    if (initialHardwareChanges && initialHardwareChanges.length > 0) {
      const hwSnap = await getDocs(collection(db, 'hardware_changes'));
      if (hwSnap.empty) {
        const hwBatch = writeBatch(db);
        for (const hw of initialHardwareChanges) {
          hwBatch.set(doc(db, 'hardware_changes', hw.id), sanitizeForFirestore(hw));
        }
        await hwBatch.commit();
      }
    }

    // Ensure default CCTV permissions exist (Matheus has full access; Marcos is blocked by default)
    const cctvPermRef = doc(db, 'system_config', 'cctv_permissions');
    const cctvPermSnap = await getDoc(cctvPermRef);
    if (!cctvPermSnap.exists()) {
      await setDoc(cctvPermRef, sanitizeForFirestore(DEFAULT_CCTV_PERMISSIONS));
    }

    // Mark global seed document as completed
    await setDoc(seedDocRef, {
      initialized: true,
      seededAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
      version: 'v4',
    });

    console.log('[FirestoreSync] Base de dados global inicializada com sucesso no Firestore!');
    return true;
  } catch (err) {
    console.warn('[FirestoreSync] Falha ou modo offline durante inicialização:', err);
    return false;
  }
}

// Backward compatibility alias
export async function checkAndInitializeDatabase(
  initialEquipments: Equipment[],
  initialOrders: ServiceOrder[],
  initialMovements: MovementRecord[],
  initialHardwareChanges: HardwareChangeRecord[]
): Promise<boolean> {
  return ensureGlobalDatabaseSeeded(
    initialEquipments,
    initialOrders,
    initialMovements,
    initialHardwareChanges
  );
}

export async function checkAndInitializeClientsAndStores(
  initialClients: Client[],
  initialStores: Store[]
): Promise<boolean> {
  return ensureGlobalDatabaseSeeded(
    undefined,
    undefined,
    undefined,
    undefined,
    initialClients,
    initialStores
  );
}

// -------------------------------------------------------------
// Real-time Subscriptions (Pure Firestore Truth)
// -------------------------------------------------------------

// 1. Equipamentos
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
      // Sort: updated newest first
      items.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveEquipment(equipment: Equipment): Promise<void> {
  const path = `equipments/${equipment.id}`;
  try {
    await setDoc(doc(db, 'equipments', equipment.id), sanitizeForFirestore(equipment), { merge: true });
    notifySyncSuccess('equipments');
    // Also sync to remote_access if relevant
    if (equipment.anydeskId || equipment.teamviewerId) {
      const remoteItem: RemoteAccess = {
        id: `ra_${equipment.id}`,
        maquinaId: equipment.id,
        nomeMaquina: equipment.nome,
        lojaNome: equipment.lojaNome || equipment.lojaOrigem || 'Matriz',
        filialNome: equipment.filialNome || equipment.lojaNome || 'Matriz',
        caixaNumero: equipment.numeroCaixa || equipment.posicaoCaixa,
        patrimonio: equipment.patrimonio,
        numeroSerie: equipment.numeroSerie,
        appAcessoRemoto: equipment.appAcessoRemoto || (equipment.anydeskId ? 'AnyDesk' : 'TeamViewer'),
        anydeskId: equipment.anydeskId || '',
        teamviewerId: equipment.teamviewerId,
        status: equipment.status === 'EM_USO' ? 'ativo' : 'em_manutencao',
        dataUltimaAtualizacao: equipment.updatedAt || new Date().toISOString(),
        tecnicoResponsavel: equipment.tecnicoResponsavel || 'Equipe TI',
        criadoEm: equipment.createdAt || new Date().toISOString(),
        atualizadoEm: equipment.updatedAt || new Date().toISOString(),
      };
      await setDoc(doc(db, 'remote_access', remoteItem.id), sanitizeForFirestore(remoteItem), { merge: true });
      notifySyncSuccess('remote_access');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteEquipment(id: string): Promise<void> {
  const path = `equipments/${id}`;
  try {
    await deleteDoc(doc(db, 'equipments', id));
    // Also delete remote access counterpart if existing
    await deleteDoc(doc(db, 'remote_access', `ra_${id}`)).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 2. Ordens de Serviço
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
      items.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveServiceOrder(order: ServiceOrder): Promise<void> {
  const path = `service_orders/${order.id}`;
  try {
    await setDoc(doc(db, 'service_orders', order.id), sanitizeForFirestore(order), { merge: true });
    notifySyncSuccess('service_orders');
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

// 3. Movimentações
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
      items.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveMovement(movement: MovementRecord): Promise<void> {
  const path = `movements/${movement.id}`;
  try {
    await setDoc(doc(db, 'movements', movement.id), sanitizeForFirestore(movement), { merge: true });
    notifySyncSuccess('movements');
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

// 4. Alterações de Hardware
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
      items.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveHardwareChange(change: HardwareChangeRecord): Promise<void> {
  const path = `hardware_changes/${change.id}`;
  try {
    await setDoc(doc(db, 'hardware_changes', change.id), sanitizeForFirestore(change), { merge: true });
    notifySyncSuccess('hardware_changes');
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

// 5. Matrizes e Filiais (Branches)
export function subscribeToBranches(
  onData: (branches: BranchUnit[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'branches';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: BranchUnit[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<BranchUnit, 'id'>) });
      });
      items.sort((a, b) => (a.idOriginal || '').localeCompare(b.idOriginal || '', undefined, { numeric: true }));
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveBranch(branch: BranchUnit): Promise<void> {
  const path = `branches/${branch.id}`;
  try {
    await setDoc(doc(db, 'branches', branch.id), sanitizeForFirestore(branch), { merge: true });
    notifySyncSuccess('branches');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteBranch(id: string): Promise<void> {
  const path = `branches/${id}`;
  try {
    await deleteDoc(doc(db, 'branches', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 6. Checklists de Filial (BranchChecklist)
export function subscribeToBranchChecklists(
  onData: (checklists: BranchChecklist[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'branch_checklists';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: BranchChecklist[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<BranchChecklist, 'id'>) });
      });
      items.sort((a, b) => new Date(b.dataAtualizacao || b.dataCriacao).getTime() - new Date(a.dataAtualizacao || a.dataCriacao).getTime());
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveBranchChecklist(checklist: BranchChecklist): Promise<void> {
  const path = `branch_checklists/${checklist.id}`;
  try {
    await setDoc(doc(db, 'branch_checklists', checklist.id), sanitizeForFirestore(checklist), { merge: true });
    notifySyncSuccess('branch_checklists');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteBranchChecklist(id: string): Promise<void> {
  const path = `branch_checklists/${id}`;
  try {
    await deleteDoc(doc(db, 'branch_checklists', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 7. Modelos de Checklist (ChecklistTemplate)
export function subscribeToChecklistTemplates(
  onData: (templates: ChecklistTemplate[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'checklist_templates';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: ChecklistTemplate[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<ChecklistTemplate, 'id'>) });
      });
      items.sort((a, b) => new Date(b.atualizadoEm || b.criadoEm).getTime() - new Date(a.atualizadoEm || a.criadoEm).getTime());
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveChecklistTemplate(template: ChecklistTemplate): Promise<void> {
  const path = `checklist_templates/${template.id}`;
  try {
    await setDoc(doc(db, 'checklist_templates', template.id), sanitizeForFirestore(template), { merge: true });
    notifySyncSuccess('checklist_templates');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteChecklistTemplate(id: string): Promise<void> {
  const path = `checklist_templates/${id}`;
  try {
    await deleteDoc(doc(db, 'checklist_templates', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 8. Trilha Imutável de Auditoria (AuditLog)
export function subscribeToAuditLogs(
  onData: (logs: AuditLog[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'audit_logs';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: AuditLog[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<AuditLog, 'id'>) });
      });
      items.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveAuditLog(log: AuditLog): Promise<void> {
  const path = `audit_logs/${log.id}`;
  try {
    await setDoc(doc(db, 'audit_logs', log.id), sanitizeForFirestore(log), { merge: true });
    notifySyncSuccess('audit_logs');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 9. Usuários e Credenciais
export function subscribeToUsers(
  onData: (users: User[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'users';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: User[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<User, 'id'>) });
      });
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveUser(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), sanitizeForFirestore(user), { merge: true });
    notifySyncSuccess('users');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteUser(id: string): Promise<void> {
  const path = `users/${id}`;
  try {
    await deleteDoc(doc(db, 'users', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToCredentials(
  onData: (credentials: Record<string, { hash: string; salt: string }>) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'system_config/auth_credentials';
  return onSnapshot(
    doc(db, 'system_config', 'auth_credentials'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onData(data?.credentials || {});
      } else {
        onData({});
      }
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function syncSaveCredentials(
  credentials: Record<string, { hash: string; salt: string }>
): Promise<void> {
  const path = 'system_config/auth_credentials';
  try {
    await setDoc(doc(db, 'system_config', 'auth_credentials'), sanitizeForFirestore({ credentials, updatedAt: serverTimestamp() }), { merge: true });
    notifySyncSuccess('user_credentials');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 10. Base de Conhecimento (KnowledgeArticle)
export function subscribeToKnowledgeArticles(
  onData: (articles: KnowledgeArticle[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'knowledge_articles';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: KnowledgeArticle[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<KnowledgeArticle, 'id'>) });
      });
      items.sort((a, b) => new Date(b.atualizadoEm || b.criadoEm).getTime() - new Date(a.atualizadoEm || a.criadoEm).getTime());
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveKnowledgeArticle(article: KnowledgeArticle): Promise<void> {
  const path = `knowledge_articles/${article.id}`;
  try {
    await setDoc(doc(db, 'knowledge_articles', article.id), sanitizeForFirestore(article), { merge: true });
    notifySyncSuccess('knowledge_articles');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteKnowledgeArticle(id: string): Promise<void> {
  const path = `knowledge_articles/${id}`;
  try {
    await deleteDoc(doc(db, 'knowledge_articles', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 11. Clientes e Lojas Legadas
export function subscribeToClients(
  onData: (clients: Client[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'clients';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Client[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<Client, 'id'>) });
      });
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveClient(client: Client): Promise<void> {
  const path = `clients/${client.id}`;
  try {
    await setDoc(doc(db, 'clients', client.id), sanitizeForFirestore(client), { merge: true });
    notifySyncSuccess('clients');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteClient(id: string): Promise<void> {
  const path = `clients/${id}`;
  try {
    await deleteDoc(doc(db, 'clients', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToStores(
  onData: (stores: Store[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'stores';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Store[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<Store, 'id'>) });
      });
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveStore(store: Store): Promise<void> {
  const path = `stores/${store.id}`;
  try {
    await setDoc(doc(db, 'stores', store.id), sanitizeForFirestore(store), { merge: true });
    notifySyncSuccess('stores');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteStore(id: string): Promise<void> {
  const path = `stores/${id}`;
  try {
    await deleteDoc(doc(db, 'stores', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 12. Checklists Salvos (Legado)
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
      items.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveChecklistRecord(record: SavedChecklistRecord): Promise<void> {
  const path = `checklist_records/${record.id}`;
  try {
    await setDoc(doc(db, 'checklist_records', record.id), sanitizeForFirestore(record), { merge: true });
    notifySyncSuccess('checklist_records');
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

// 13. Acesso Remoto (AnyDesk / TeamViewer)
export function subscribeToRemoteAccess(
  onData: (items: RemoteAccess[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'remote_access';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: RemoteAccess[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<RemoteAccess, 'id'>) });
      });
      items.sort((a, b) => new Date(b.atualizadoEm || b.criadoEm).getTime() - new Date(a.atualizadoEm || a.criadoEm).getTime());
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveRemoteAccess(item: RemoteAccess): Promise<void> {
  const path = `remote_access/${item.id}`;
  try {
    await setDoc(doc(db, 'remote_access', item.id), sanitizeForFirestore(item), { merge: true });
    notifySyncSuccess('remote_access');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteRemoteAccess(id: string): Promise<void> {
  const path = `remote_access/${id}`;
  try {
    await deleteDoc(doc(db, 'remote_access', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 14. Histórico de Acesso Remoto
export function subscribeToRemoteAccessHistory(
  onData: (items: RemoteAccessHistory[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'remote_access_history';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: RemoteAccessHistory[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<RemoteAccessHistory, 'id'>) });
      });
      items.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveRemoteAccessHistory(item: RemoteAccessHistory): Promise<void> {
  const path = `remote_access_history/${item.id}`;
  try {
    await setDoc(doc(db, 'remote_access_history', item.id), sanitizeForFirestore(item), { merge: true });
    notifySyncSuccess('remote_access_history');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 15. Projetos de Câmeras CFTV & Plantas Baixas
export function subscribeToCctvProjects(
  onData: (projects: CctvProject[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'cctv_projects';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: CctvProject[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<CctvProject, 'id'>) });
      });
      items.sort((a, b) => new Date(b.atualizadoEm || b.criadoEm).getTime() - new Date(a.atualizadoEm || a.criadoEm).getTime());
      notifySyncSuccess(path, items.length);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncSaveCctvProject(project: CctvProject): Promise<void> {
  const path = `cctv_projects/${project.id}`;
  try {
    await setDoc(doc(db, 'cctv_projects', project.id), sanitizeForFirestore(project), { merge: true });
    notifySyncSuccess('cctv_projects');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteCctvProject(id: string): Promise<void> {
  const path = `cctv_projects/${id}`;
  try {
    await deleteDoc(doc(db, 'cctv_projects', id));
    notifySyncSuccess('cctv_projects');
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 16. Configuração de Permissões CFTV (Matheus -> Marcos)
export const DEFAULT_CCTV_PERMISSIONS: CctvPermissionsConfig = {
  marcosViewAllowed: false,
  marcosEditAllowed: false,
  atualizadoEm: new Date().toISOString(),
  atualizadoPor: 'Matheus Guarnieri',
};

export function subscribeToCctvPermissions(
  onData: (config: CctvPermissionsConfig) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'system_config/cctv_permissions';
  return onSnapshot(
    doc(db, 'system_config', 'cctv_permissions'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as CctvPermissionsConfig;
        onData(data);
      } else {
        onData(DEFAULT_CCTV_PERMISSIONS);
      }
      notifySyncSuccess('cctv_permissions');
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function syncSaveCctvPermissions(config: CctvPermissionsConfig): Promise<void> {
  const path = 'system_config/cctv_permissions';
  try {
    await setDoc(
      doc(db, 'system_config', 'cctv_permissions'),
      sanitizeForFirestore({ ...config, atualizadoEm: new Date().toISOString() }),
      { merge: true }
    );
    notifySyncSuccess('cctv_permissions');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Centralized Test Data Purge Function
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

  const movSnap = await getDocs(collection(db, 'movements'));
  movSnap.forEach((docSnap) => {
    if (DEMO_MOVEMENT_IDS.has(docSnap.id)) {
      batch.delete(docSnap.ref);
      deletedMovements++;
    }
  });

  const hwSnap = await getDocs(collection(db, 'hardware_changes'));
  hwSnap.forEach((docSnap) => {
    if (DEMO_HARDWARE_IDS.has(docSnap.id)) {
      batch.delete(docSnap.ref);
      deletedHardware++;
    }
  });

  batch.set(
    doc(db, 'system_config', 'global_seed_v4'),
    {
      initialized: true,
      lastPurgedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();

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
