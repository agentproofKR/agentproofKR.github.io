import { describe, expect, it } from "vitest";

import { getStoredUtm, readUtmFromUrl, storeInitialUtm } from "../../lib/utm";

describe("utm helpers", () => {
  it("reads only the four supported UTM values", () => {
    expect(
      readUtmFromUrl(
        "https://agentproof.test/?utm_source=linkedin&utm_medium=social&utm_campaign=launch&utm_content=founder-post-01&utm_term=ignored",
      ),
    ).toEqual({
      source: "linkedin",
      medium: "social",
      campaign: "launch",
      content: "founder-post-01",
    });
  });

  it("preserves the first touch UTM in sessionStorage", () => {
    const storage = new Map<string, string>();
    const sessionStorageLike = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    };

    storeInitialUtm(
      { source: "first", medium: "social", campaign: "launch", content: "a" },
      sessionStorageLike,
    );
    storeInitialUtm(
      { source: "second", medium: "email", campaign: "later", content: "b" },
      sessionStorageLike,
    );

    expect(getStoredUtm(sessionStorageLike)).toEqual({
      source: "first",
      medium: "social",
      campaign: "launch",
      content: "a",
    });
  });
});
