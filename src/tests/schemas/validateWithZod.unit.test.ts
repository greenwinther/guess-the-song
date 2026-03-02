import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { validateWithZod } from "@/server/schemas";

test("validateWithZod returns parsed data on success", () => {
	const schema = z.object({
		code: z.string().min(1),
	});
	const result = validateWithZod(schema, { code: "AB12" });

	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.data.code, "AB12");
});

test("validateWithZod returns normalized issues on failure", () => {
	const schema = z.object({
		payload: z.object({
			code: z.string().length(4),
		}),
	});
	const result = validateWithZod(schema, { payload: { code: "A" } }, { errorMessage: "Bad payload" });

	assert.equal(result.ok, false);
	if (result.ok) return;
	assert.equal(result.error, "Bad payload");
	assert.ok(result.issues.some((issue) => issue.path === "payload.code"));
});
