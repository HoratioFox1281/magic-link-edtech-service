import test from "node:test";
import assert from "node:assert/strict";
import { deadlineStatus } from "./magic_link_service.ts";

test("course access closes at the learner deadline", () => {
  const deadline = "2026-12-01T17:00:00.000Z";
  assert.equal(deadlineStatus(deadline, "2026-12-01T16:59:59.000Z"), "open");
  assert.equal(deadlineStatus(deadline, deadline), "closed");
});
