// lib/phone.ts
//
// UAE-specific phone helpers.
//
// UAE mobile numbers always start with "05" (050, 052, 054, 055, 056, 058)
// in national format. Landlines use area codes like 02 (Abu Dhabi),
// 03 (Al Ain), 04 (Dubai), 06 (Sharjah/Ajman), 07 (RAK/Fujairah), 09
// (Fujairah) - none of which start with "05". This lets us reliably tell
// them apart from the "nationalPhoneNumber" field Google returns.
//
// NOTE: this logic is UAE-specific. If you ever search other countries,
// this check will need its own rule set per country.

export function isLikelyMobileUAE(phone: string | null): boolean {
  if (!phone) return false;
  const digitsOnly = phone.replace(/\D/g, ""); // strip spaces, dashes, etc.

  // Handle numbers that already include the +971 country code
  const local = digitsOnly.startsWith("971")
    ? "0" + digitsOnly.slice(3) // normalize back to national format
    : digitsOnly;

  return local.startsWith("05");
}

// Converts a UAE national-format number (e.g. "050 123 4567") into the
// international digits-only format WhatsApp's wa.me links require
// (e.g. "971501234567").
export function toWhatsAppNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.startsWith("971")) return digitsOnly;
  if (digitsOnly.startsWith("0")) return "971" + digitsOnly.slice(1);
  return "971" + digitsOnly;
}
