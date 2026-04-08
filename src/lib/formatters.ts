import { Timestamp } from "firebase/firestore";

export function formatCurrency(
  amount: number,
  currencyCode: string,
  locale: string
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(
  date: Date | Timestamp | null | undefined,
  timezone?: string
): string {
  if (!date) return "N/A";
  const d = date instanceof Timestamp ? date.toDate() : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: timezone,
  }).format(d);
}

export function formatDateTime(
  date: Date | Timestamp | null | undefined,
  timezone?: string
): string {
  if (!date) return "N/A";
  const d = date instanceof Timestamp ? date.toDate() : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(d);
}

export function formatRelativeTime(
  date: Date | Timestamp | null | undefined
): string {
  if (!date) return "N/A";
  const d = date instanceof Timestamp ? date.toDate() : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

export function formatPhone(phone: string): string {
  if (!phone) return "";
  if (phone.startsWith("+234")) {
    const local = phone.slice(4);
    return `+234 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  if (phone.startsWith("+971")) {
    const local = phone.slice(4);
    return `+971 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }
  return phone;
}

export function formatLeadScore(score: number): string {
  if (score >= 80) return "Hot";
  if (score >= 50) return "Warm";
  return "Cold";
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
