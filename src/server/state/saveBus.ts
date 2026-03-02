let saveHandler: (() => void) | null = null;

export function setStateSaveHandler(handler: () => void) {
	saveHandler = handler;
}

export function notifyStateChange() {
	saveHandler?.();
}
