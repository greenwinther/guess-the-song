import { z } from "zod";

export type ZodValidationIssue = {
	code: string;
	path: string;
	message: string;
};

export type ZodValidationSuccess<T> = {
	ok: true;
	data: T;
};

export type ZodValidationFailure = {
	ok: false;
	error: string;
	issues: ZodValidationIssue[];
};

export type ZodValidationResult<T> = ZodValidationSuccess<T> | ZodValidationFailure;

const pathToString = (path: Array<PropertyKey>) => {
	if (path.length === 0) return "root";
	return path.map(String).join(".");
};

export function zodIssues(error: z.ZodError): ZodValidationIssue[] {
	return error.issues.map((issue) => ({
		code: issue.code,
		path: pathToString(issue.path),
		message: issue.message,
	}));
}

export function validateWithZod<TSchema extends z.ZodTypeAny>(
	schema: TSchema,
	input: unknown,
	options?: { errorMessage?: string }
): ZodValidationResult<z.infer<TSchema>> {
	const result = schema.safeParse(input);
	if (result.success) {
		return { ok: true, data: result.data };
	}

	return {
		ok: false,
		error: options?.errorMessage ?? "Invalid input",
		issues: zodIssues(result.error),
	};
}
