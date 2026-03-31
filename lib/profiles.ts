export const PROFILES_STORAGE_KEY = "life-calendar:profiles";

export type LifeProfile = {
  id: string;
  name: string;
  birthDate: string;
  createdAt: string;
  updatedAt: string;
};

function isValidDateString(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isLifeProfile(value: unknown): value is LifeProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LifeProfile>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    isValidDateString(candidate.birthDate) &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

export function sortProfiles(profiles: LifeProfile[]) {
  return [...profiles].sort((left, right) => {
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function parseStoredProfiles(rawValue: string | null) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortProfiles(parsed.filter(isLifeProfile));
  } catch {
    return [];
  }
}

export function createProfileId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
