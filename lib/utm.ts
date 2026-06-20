export type UtmValues = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
};

type SessionStorageLike = Pick<Storage, "getItem" | "setItem">;

const storageKey = "agentproof:first-touch-utm";

export function readUtmFromUrl(url: string): UtmValues {
  const parsed = new URL(url);
  return compactUtm({
    source: parsed.searchParams.get("utm_source") ?? undefined,
    medium: parsed.searchParams.get("utm_medium") ?? undefined,
    campaign: parsed.searchParams.get("utm_campaign") ?? undefined,
    content: parsed.searchParams.get("utm_content") ?? undefined,
  });
}

export function storeInitialUtm(values: UtmValues, storage: SessionStorageLike): void {
  if (storage.getItem(storageKey)) {
    return;
  }
  storage.setItem(storageKey, JSON.stringify(compactUtm(values)));
}

export function getStoredUtm(storage: SessionStorageLike): UtmValues {
  const value = storage.getItem(storageKey);
  if (!value) {
    return {};
  }
  try {
    return compactUtm(JSON.parse(value) as UtmValues);
  } catch {
    return {};
  }
}

function compactUtm(values: UtmValues): UtmValues {
  return Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [key, typeof value === "string" ? value.trim() : undefined])
      .filter(([, value]) => typeof value === "string" && value.length > 0),
  ) as UtmValues;
}
