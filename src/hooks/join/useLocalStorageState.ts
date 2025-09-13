// src/hooks/join/useLocalStorageState.ts
import { useEffect, useRef, useState } from "react";

export function useLocalStorageState<T>(key: string, initial: T) {
	const [state, setState] = useState<T>(() => {
		try {
			const raw = localStorage.getItem(key);
			return raw ? (JSON.parse(raw) as T) : initial;
		} catch {
			return initial;
		}
	});
	const keyRef = useRef(key);

	useEffect(() => {
		keyRef.current = key;
	}, [key]);

	useEffect(() => {
		try {
			localStorage.setItem(keyRef.current, JSON.stringify(state));
		} catch {}
	}, [state]);

	return [state, setState] as const;
}
