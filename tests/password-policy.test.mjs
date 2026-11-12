import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import test from "node:test";
import {
  getPasswordConfirmationError,
  getPasswordError,
  PASSWORD_MIN_LENGTH,
} from "../src/lib/passwordPolicy.ts";

// 현재 프론트 정책: 최소 8자만 검사한다.
// 반복·연속 문자, 흔한 비밀번호, 문자 종류 제한은 적용하지 않는다(#46에서 완화).
const passwordCases = [
  ["empty input", "", false],
  ["seven-character boundary", "R7!m2#T", false],
  ["eight-character boundary", "R7!m2#T9", true],
  ["strong mixed password", "R7!m2#T9q", true],
  ["letter passphrase", "MapleRiverCobaltLantern", true],
  ["repeated character", "R7!aaaT9", true],
  ["repeated block", "Ab1!Ab1!", true],
  ["ascending numbers", "R7!1234T9", true],
  ["common word with suffix", "Password9!", true],
  ["korean characters", "비밀번호입니다", false],
  ["korean characters over the minimum", "비밀번호입니다여덟자", true],
  ["whitespace inside", "R7!m 2#T9", true],
];

for (const [caseName, password, isAllowed] of passwordCases) {
  test(`password policy: ${caseName}`, () => {
    assert.equal(getPasswordError(password) === undefined, isAllowed);
  });
}

test("minimum length is eight", () => {
  assert.equal(PASSWORD_MIN_LENGTH, 8);
});

test("a custom minimum length overrides the default", () => {
  assert.equal(getPasswordError("R7!m2#T9", 10), "10자 이상 입력해 주세요.");
  assert.equal(getPasswordError("R7!m2#T9ab", 10), undefined);
});

test("confirmation accepts exactly matching input", () => {
  assert.equal(getPasswordConfirmationError("R7!m2#T9", "R7!m2#T9"), undefined);
});

test("confirmation rejects a different draft", () => {
  assert.ok(getPasswordConfirmationError("R7!m2#T9", "R7!m2#T8"));
});

test("confirmation rejects empty input", () => {
  assert.ok(getPasswordConfirmationError("R7!m2#T9", ""));
});

test("million-character input completes without backtracking", () => {
  const password = "Q7!mR2#n".repeat(125000);
  const startedAt = performance.now();
  assert.equal(getPasswordError(password), undefined);
  assert.ok(performance.now() - startedAt < 3000);
});
