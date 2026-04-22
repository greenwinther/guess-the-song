import { z } from "zod";

export function firstFieldIssue(error: z.ZodError, field: string): string | null {
	for (const issue of error.issues) {
		if (issue.path[0] === field) return issue.message;
	}
	return null;
}
