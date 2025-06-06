// src/utils/shuffleArray.ts
export function shuffleArray<T>(arr: T[]): T[] {
	return arr
		.map((a) => [Math.random(), a] as [number, T])
		.sort((a, b) => a[0] - b[0])
		.map(([, v]) => v);
}
