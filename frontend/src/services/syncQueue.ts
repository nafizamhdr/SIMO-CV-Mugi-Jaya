import { updateWorkItemStatus } from "./produksi.service";
import type { WorkItemStatus } from "../types";

/**
 * Offline-sync queue (NFR-05).
 * Saat update status produksi gagal terkirim (offline), simpan ke antrian
 * di localStorage dengan key `simo_sync_queue`, lalu sinkronkan otomatis
 * ketika koneksi kembali online.
 *
 * Catatan: foto tidak diantrikan offline (hanya status & catatan) agar ukuran
 * localStorage tetap aman; foto dapat diunggah ulang saat online.
 */
const QUEUE_KEY = "simo_sync_queue";

export interface QueuedStatusUpdate {
  workItemId: string;
  status: WorkItemStatus;
  queuedAt: string;
}

function readQueue(): QueuedStatusUpdate[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as QueuedStatusUpdate[];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedStatusUpdate[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function queueSize(): number {
  return readQueue().length;
}

/** Tambahkan update status ke antrian offline. */
export function enqueueStatusUpdate(workItemId: string, status: WorkItemStatus): void {
  const queue = readQueue();
  // Hanya simpan update terbaru per work item.
  const filtered = queue.filter((q) => q.workItemId !== workItemId);
  filtered.push({ workItemId, status, queuedAt: new Date().toISOString() });
  writeQueue(filtered);
}

/**
 * Coba sinkronkan seluruh antrian. Item yang berhasil dihapus dari antrian;
 * yang gagal tetap tertinggal untuk dicoba lagi nanti.
 * Mengembalikan jumlah item yang berhasil disinkronkan.
 */
export async function flushQueue(): Promise<number> {
  const queue = readQueue();
  if (queue.length === 0) return 0;

  const remaining: QueuedStatusUpdate[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      await updateWorkItemStatus(item.workItemId, item.status, null);
      synced++;
    } catch {
      remaining.push(item); // gagal -> tetap di antrian
    }
  }

  writeQueue(remaining);
  return synced;
}

/** Daftarkan auto-sync saat browser kembali online. */
export function registerAutoSync(onSynced?: (count: number) => void): () => void {
  const handler = async () => {
    const count = await flushQueue();
    if (count > 0) onSynced?.(count);
  };
  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}
