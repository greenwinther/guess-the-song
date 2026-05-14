export type AccessStatus = "checking" | "unauthorized" | "not_found";

export function getAccessStatusMessage(
	status: AccessStatus,
	messages: Record<AccessStatus, string>
): string {
	return messages[status];
}
