import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { isEmail } from "../src/lib/email.ts";

test("isEmail accepts normal addresses", () => {
  for (const v of ["manager@example.com", "sam.kim@company.co.kr", " ops@heatguard.kr "]) assert.equal(isEmail(v), true, v);
});

test("isEmail rejects malformed addresses", () => {
  for (const v of ["", "manager", "manager@", "@example.com", "a b@example.com", "manager@example"]) assert.equal(isEmail(v), false, v);
});

test("site invitation page uses the shared email check (no hand-written regex)", () => {
  const source = readFileSync(new URL("../src/pages/site/SiteInvitationPage.tsx", import.meta.url), "utf8");
  assert.match(source, /isEmail\(email\)/);
  assert.doesNotMatch(source, /EMAIL_RE/);
});
