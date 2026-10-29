import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import test from "node:test";
import {
  getPasswordConfirmationError,
  getPasswordError,
} from "../src/lib/passwordPolicy.ts";

const passwordCases = [
  ["empty input", "", false],
  ["seven-character boundary", "R7!m2#T", false],
  ["eight-character boundary", "R7!m2#T9", true],
  ["complete Korean", "R7!m한글T9", false],
  ["Korean jamo", "R7!mㄱ#T9", false],
  ["emoji", "R7!m😀#T9", false],
  ["leading whitespace", " R7!m2#T9", false],
  ["middle whitespace", "R7!m 2#T9", false],
  ["trailing whitespace", "R7!m2#T9 ", false],
  ["newline", "R7!m\n2#T9", false],
  ["repeated character", "R7!aaaT9", false],
  ["case-variant repeated character", "R7!aAaT9", false],
  ["repeated block", "Ab1!Ab1!", false],
  ["ascending numbers", "R7!1234T9", false],
  ["descending numbers", "R7!4321T9", false],
  ["ascending letters", "R7!abcdT9", false],
  ["descending letters", "R7!dcbaT9", false],
  ["common word with suffix", "Password9!", false],
  ["common keyboard word", "qwerty9!", false],
  ["common word obscured by punctuation", "p@assword9!", false],
  ["strong mixed password", "R7!m2#T9q", true],
  ["strong letter passphrase", "MapleRiverCobaltLantern", true],
  ["two repeated characters", "R7!mm2#T9", true],
  ["similar nonrepeated blocks", "Ab1!Ab2!", true],
  ["not a four-character sequence", "R7!1243T9", true],
  ["word inside a long passphrase", "PasswordRiverCobaltLantern", true],
];

for (const [caseName, password, isAllowed] of passwordCases) {
  test(`password policy: ${caseName}`, () => {
    assert.equal(getPasswordError(password) === undefined, isAllowed);
  });
}

test("confirmation accepts exactly matching input", () => {
  assert.equal(
    getPasswordConfirmationError("R7!m2#T9", "R7!m2#T9"),
    undefined,
  );
});

test("confirmation rejects invalid characters", () => {
  assert.ok(getPasswordConfirmationError("R7!m2#T9", "R7!m2#T9한"));
});

test("confirmation rejects a different draft", () => {
  assert.ok(getPasswordConfirmationError("R7!m2#T9", "R7!m2#T8"));
});

test("confirmation rejects empty input", () => {
  assert.ok(getPasswordConfirmationError("R7!m2#T9", ""));
});

test("million-character repetition completes without backtracking", () => {
  const password = "Q7!mR2#n".repeat(125000);
  const startedAt = performance.now();
  assert.ok(getPasswordError(password));
  assert.ok(performance.now() - startedAt < 3000);
});
