export const ENABLED_SOCIAL_PROVIDERS = [
  "linkedin",
  "facebook",
  "instagram",
  "youtube",
  "whatsapp"
];

export const STANDARD_PUBLISH_PROVIDERS = [
  "LinkedIn",
  "Facebook",
  "Instagram",
  "YouTube"
];

export const SOCIAL_PROVIDER_META = {
  linkedin: { label: "LinkedIn", icon: "in", purpose: "B2B authority, technical credibility & decision-makers" },
  facebook: { label: "Facebook", icon: "f", purpose: "Customer trust, company updates & Page content" },
  instagram: { label: "Instagram", icon: "◎", purpose: "Visual discovery, reels & product applications" },
  youtube: { label: "YouTube", icon: "▶", purpose: "Product demos, tutorials & technical education" },
  whatsapp: { label: "WhatsApp", icon: "WA", purpose: "Business messaging & multi-number workflows" }
};

export function isEnabledProvider(idOrLabel) {
  const id = String(idOrLabel || "").trim().toLowerCase();
  return ENABLED_SOCIAL_PROVIDERS.includes(id);
}
