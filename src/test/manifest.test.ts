import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The home-screen install depends on this file staying valid and complete.
const manifest = JSON.parse(
  readFileSync(new URL("../../public/manifest.webmanifest", import.meta.url), "utf8"),
);

describe("web app manifest", () => {
  it("launches Stockify Learn as a standalone app", () => {
    expect(manifest.name).toBe("Stockify Learn");
    expect(manifest.short_name).toBe("Stockify");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
  });

  it("matches the brand colours", () => {
    expect(manifest.theme_color).toBe("#0F172B");
    expect(manifest.background_color).toBe("#0F172B");
  });

  it("ships the icons Android and iOS require to install", () => {
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === "maskable")).toBe(true);
  });

  it("points every icon at a file that exists", () => {
    for (const icon of manifest.icons as { src: string }[]) {
      expect(() =>
        readFileSync(new URL(`../../public${icon.src}`, import.meta.url)),
      ).not.toThrow();
    }
  });
});
