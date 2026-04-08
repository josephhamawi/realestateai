export function isValidE164Phone(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidMarket(market: string): market is "nigeria" | "dubai" {
  return market === "nigeria" || market === "dubai";
}

export function isValidTier(tier: string): tier is "solo" | "team" | "brokerage" {
  return tier === "solo" || tier === "team" || tier === "brokerage";
}

export function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")  // Strip HTML tags
    .replace(/[^\S ]+/g, " ") // Normalize whitespace
    .trim()
    .slice(0, 4096);          // Limit length
}

export function normalizePhone(phone: string, market: "nigeria" | "dubai"): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Add country code if missing
  if (!cleaned.startsWith("+")) {
    if (market === "nigeria") {
      if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
      cleaned = "+234" + cleaned;
    } else {
      if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
      cleaned = "+971" + cleaned;
    }
  }

  return cleaned;
}
