import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});

describe("Desktop routes", () => {
  it("still match the simulator, calculator and lesson pages", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/simulator").at(-1)?.routeId).toBe("/simulator");
    expect(router.matchRoutes("/calculator").at(-1)?.routeId).toBe("/calculator");
    expect(router.matchRoutes("/learn/what-is-a-stock").at(-1)?.routeId).toBe("/learn/$slug");
    expect(router.matchRoutes("/learn/compound-interest").at(-1)?.routeId).toBe("/learn/$slug");
    expect(router.matchRoutes("/learn").at(-1)?.routeId).toBe("/learn/");
    expect(router.matchRoutes("/practice").at(-1)?.routeId).toBe("/practice");
  });
});
