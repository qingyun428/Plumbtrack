import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses the Next.js runtime expected by Vercel", async () => {
  const [packageJson, nextEnv, page] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../next-env.d.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  const pkg = JSON.parse(packageJson);
  assert.equal(pkg.scripts.dev, "next dev");
  assert.equal(pkg.scripts.build, "next build");
  assert.equal(pkg.scripts.start, "next start");
  assert.equal(pkg.engines.node, "24.x");
  assert.ok(pkg.dependencies.next);
  assert.equal(pkg.dependencies.vinext, undefined);
  assert.equal(pkg.devDependencies.vite, undefined);
  assert.equal(pkg.devDependencies.wrangler, undefined);
  assert.match(nextEnv, /reference types="next"/);
  assert.match(page, /getSupabaseBrowserClient/);
  assert.match(page, /signInWithPassword/);
  assert.match(page, /\.from\("projects"\)/);
});
