import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEpicChildrenQuery,
  findNextActionableChild,
  byCreatedAsc,
} from "../.github/scripts/epic-runner.mjs";

function child(key, statusCategoryKey, created) {
  return {
    key,
    fields: {
      status: { statusCategory: { key: statusCategoryKey } },
      created,
    },
  };
}

test("buildEpicChildrenQuery returns expected JQL body shape", () => {
  const body = buildEpicChildrenQuery("TDS-42");
  assert.equal(body.jql, 'parent = "TDS-42"');
  assert.deepEqual(body.fields, ["summary", "status", "issuetype", "parent", "created"]);
  assert.equal(body.maxResults, 200);
});

test("buildEpicChildrenQuery strips embedded quotes from key", () => {
  const body = buildEpicChildrenQuery('TDS-1"; DROP--');
  assert.equal(body.jql, 'parent = "TDS-1; DROP--"');
});

test("findNextActionableChild returns undefined for empty array", () => {
  assert.equal(findNextActionableChild([]), undefined);
});

test("findNextActionableChild returns undefined when all children are done", () => {
  const items = [
    child("TDS-2", "done", "2026-05-01T10:00:00.000Z"),
    child("TDS-3", "done", "2026-05-01T11:00:00.000Z"),
  ];
  assert.equal(findNextActionableChild(items), undefined);
});

test("findNextActionableChild returns the first non-done child", () => {
  const items = [
    child("TDS-2", "done", "2026-05-01T10:00:00.000Z"),
    child("TDS-3", "new", "2026-05-01T11:00:00.000Z"),
    child("TDS-4", "indeterminate", "2026-05-01T12:00:00.000Z"),
  ];
  const next = findNextActionableChild(items);
  assert.equal(next.key, "TDS-3");
});

test("findNextActionableChild returns first In-Progress when prior children are Done", () => {
  const items = [
    child("TDS-2", "done", "2026-05-01T10:00:00.000Z"),
    child("TDS-3", "indeterminate", "2026-05-01T11:00:00.000Z"),
  ];
  const next = findNextActionableChild(items);
  assert.equal(next.key, "TDS-3");
});

test("findNextActionableChild with afterCreated skips entries at or before that timestamp", () => {
  const items = [
    child("TDS-2", "new", "2026-05-01T10:00:00.000Z"),
    child("TDS-3", "new", "2026-05-01T11:00:00.000Z"),
    child("TDS-4", "new", "2026-05-01T12:00:00.000Z"),
  ];
  const next = findNextActionableChild(items, "2026-05-01T11:00:00.000Z");
  assert.equal(next.key, "TDS-4");
});

test("findNextActionableChild with afterCreated falls back to first not-Done if none after", () => {
  const items = [
    child("TDS-2", "new", "2026-05-01T10:00:00.000Z"),
    child("TDS-3", "done", "2026-05-01T11:00:00.000Z"),
  ];
  const next = findNextActionableChild(items, "2026-05-01T12:00:00.000Z");
  assert.equal(next.key, "TDS-2");
});

test("byCreatedAsc sorts ascending by created", () => {
  const items = [
    child("TDS-3", "new", "2026-05-01T12:00:00.000Z"),
    child("TDS-1", "new", "2026-05-01T10:00:00.000Z"),
    child("TDS-2", "new", "2026-05-01T11:00:00.000Z"),
  ];
  items.sort(byCreatedAsc);
  assert.deepEqual(items.map((i) => i.key), ["TDS-1", "TDS-2", "TDS-3"]);
});
