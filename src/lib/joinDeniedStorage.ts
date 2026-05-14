"use client";

export type JoinDeniedReason =
	| "kicked"
	| "closed"
	| "not_found"
	| "name_taken"
	| "unauthorized"
	| "error";

export type JoinDeniedRole = "player" | "host";

type JoinDeniedRecord = {
	reason: JoinDeniedReason;
	at: number;
	code?: string;
	role?: JoinDeniedRole;
	playerName?: string;
};

export type JoinDeniedScope = {
	code?: string | null;
	role?: JoinDeniedRole;
	playerName?: string | null;
};

const STORAGE_KEY = "gts-join-denied";

const normalizeText = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

const normalizeCode = (value: string | null | undefined) => (value ?? "").trim().toUpperCase();

export function readJoinDeniedRecord(): JoinDeniedRecord | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as JoinDeniedRecord;
		if (!parsed?.reason) return null;
		return parsed;
	} catch {
		return null;
	}
}

export function writeJoinDeniedRecord(input: Omit<JoinDeniedRecord, "at">) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...input, at: Date.now() }));
		window.dispatchEvent(new Event("gts-join-denied"));
	} catch {}
}

export function isJoinDeniedRecordInScope(
	record: JoinDeniedRecord | null | undefined,
	scope?: JoinDeniedScope
) {
	if (!record?.reason) return false;
	if (!scope) return true;

	if (scope.code && !record.code) return false;
	if (scope.code && normalizeCode(record.code) !== normalizeCode(scope.code)) {
		return false;
	}
	if (scope.role && !record.role) return false;
	if (scope.role && record.role !== scope.role) {
		return false;
	}
	if (scope.playerName && !record.playerName) return false;
	if (
		scope.playerName &&
		normalizeText(record.playerName) !== normalizeText(scope.playerName)
	) {
		return false;
	}

	return true;
}

function clearJoinDeniedRecord() {
	try {
		localStorage.removeItem(STORAGE_KEY);
		window.dispatchEvent(new Event("gts-join-denied"));
	} catch {}
}

export function clearJoinDeniedRecordInScope(scope?: JoinDeniedScope) {
	const existing = readJoinDeniedRecord();
	if (!isJoinDeniedRecordInScope(existing, scope)) return;
	clearJoinDeniedRecord();
}
