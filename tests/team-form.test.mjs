import assert from "node:assert/strict";
import test from "node:test";
import { formatTeamPhone, validateTeamForm } from "../src/lib/teamForm.ts";

test("formatTeamPhone adds hyphens while typing", () => {
  assert.equal(formatTeamPhone("010"), "010");
  assert.equal(formatTeamPhone("0101234"), "010-1234");
  assert.equal(formatTeamPhone("01012345678"), "010-1234-5678");
  assert.equal(formatTeamPhone("010-1234-56789"), "010-1234-5678", "extra digits are dropped");
  assert.equal(formatTeamPhone("0111234567"), "011-123-4567");
  assert.equal(formatTeamPhone("0212345678"), "02-1234-5678");
  assert.equal(formatTeamPhone("021234567"), "02-123-4567");
});

const base = { leaderName: "홍길동", workLocation: "3층", contact: "010-1234-5678", memberCount: "" };

test("validateTeamForm requires the leader phone (server needs it for app linking)", () => {
  assert.equal(validateTeamForm(base), null);
  assert.equal(validateTeamForm({ ...base, contact: "" }), "팀장 전화번호를 입력해주세요.");
  assert.match(validateTeamForm({ ...base, contact: "1234" }) ?? "", /전화번호 형식/);
});

test("validateTeamForm keeps the other rules", () => {
  assert.equal(validateTeamForm({ ...base, leaderName: " " }), "이름은 필수예요.");
  assert.match(validateTeamForm({ ...base, memberCount: "0" }) ?? "", /1~999/);
});
