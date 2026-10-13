/**
 * Utilitários para formatação padronizada de datas no formato brasileiro (DD/MM/AAAA)
 * e horários no formato 24 horas (DD/MM/AAAA HH:mm).
 */

export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export function formatDateTimeBR(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    // If it's YYYY-MM-DDTHH:mm or ISO
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

export function formatShortDateTimeBR(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

export function calculateDaysBetween(startDateStr?: string | null, endDateStr?: string | null): number {
  if (!startDateStr) return 0;
  try {
    const start = new Date(startDateStr);
    const end = endDateStr ? new Date(endDateStr) : new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}
