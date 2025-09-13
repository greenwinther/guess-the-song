// src/app/components/ui/loading.tsx
export default function Loading() {
	return (
		<div className="min-h-screen p-8">
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-pulse">
				<div className="lg:col-span-3 space-y-3">
					<div className="h-8 bg-border/50 rounded" />
					<div className="h-20 bg-border/50 rounded" />
					<div className="h-48 bg-border/50 rounded" />
				</div>
				<div className="lg:col-span-6 space-y-4">
					<div className="h-8 bg-border/50 rounded" />
					<div className="aspect-video bg-border/50 rounded" />
					<div className="h-12 bg-border/50 rounded" />
				</div>
				<div className="lg:col-span-3 space-y-3">
					<div className="h-8 bg-border/50 rounded" />
					<div className="h-64 bg-border/50 rounded" />
				</div>
			</div>
		</div>
	);
}
