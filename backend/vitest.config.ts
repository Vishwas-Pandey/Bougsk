import { defineConfig } from "vitest/config";

// Minimal test suite (Build Spec §Testing, staging & monitoring) — covers
// the pure, money- and security-critical logic pulled out of the Edge
// Functions in functions/_shared/. It intentionally does NOT cover
// create_order_tx's tax/stock-decrement SQL (migration 0004): that lives in
// Postgres and needs a real database to exercise, which is out of scope for
// a free-standing Vitest suite. Test that path against a staging Supabase
// project instead (see the Build Spec's "second, free Supabase project as
// staging" note) once one exists.
export default defineConfig({
  test: {
    environment: "node",
    include: ["functions/**/*.test.ts"],
  },
});
