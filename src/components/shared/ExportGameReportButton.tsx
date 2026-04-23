"use client";

import { useEffect, useMemo, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import toast from "react-hot-toast";
import { useSocket } from "@/contexts/SocketContext";
import Button, { type ButtonSize, type ButtonVariant } from "@/components/shared/Button";
import type { AdminDashboardPayload } from "@/types/socket";

const esc = (value: unknown) =>
	String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

const buildReportHtml = ({
	roomCode,
	theme,
	scores,
	dashboard,
}: {
	roomCode: string;
	theme?: string;
	scores: Record<string, number>;
	dashboard: AdminDashboardPayload;
}) => {
	const exportedAt = new Date().toLocaleString();
	const histories = Array.isArray(dashboard.playerHistories) ? dashboard.playerHistories : [];
	const players = Array.isArray(dashboard.players) ? dashboard.players : [];
	const themeData = dashboard.theme ?? { revealed: false, solvedBy: [] as string[] };
	const scoreRows = Object.entries(scores)
		.sort(([, a], [, b]) => b - a)
		.map(
			([name, points], idx) =>
				`<tr><td>${idx + 1}</td><td>${esc(name)}</td><td>${esc(points)}</td></tr>`,
		)
		.join("");
	const songs = histories[0]?.rounds ?? [];
	const songsRows = songs
		.map(
			(row) =>
				`<tr><td>${row.songIndex}</td><td>${esc(row.songTitle || "Untitled")}</td><td>${esc(
					row.correctAnswer,
				)}</td><td>${esc(row.detailCorrectAnswer || "-")}</td></tr>`,
		)
		.join("");
	const playerSections = histories
		.map((player) => {
			const roundsRows = player.rounds
				.map(
					(row) => `<tr>
<td>${row.songIndex}</td>
<td>${esc(row.songTitle || "Untitled")}</td>
<td>${esc(row.guessLabel)}</td>
<td>${esc(row.correctAnswer)}</td>
<td>${row.locked ? "Yes" : "No"}</td>
<td>${esc(row.detailGuessLabel || "-")}</td>
<td>${esc(row.detailCorrectAnswer || "-")}</td>
<td>${row.detailLocked ? "Yes" : "No"}</td>
<td>${esc(row.themeGuess || "-")}</td>
</tr>`,
				)
				.join("");
			return `<h3>${esc(player.playerName)}</h3>
<table>
<thead><tr><th>#</th><th>Song</th><th>Guess</th><th>Correct</th><th>Locked</th><th>Bonus Guess</th><th>Bonus Correct</th><th>Bonus Locked</th><th>Theme Guess</th></tr></thead>
<tbody>${roundsRows}</tbody>
</table>`;
		})
		.join("");
	const playersMeta = players
		.filter((p) => !p.isHost)
		.map((p) => `${esc(p.name)}${p.hardcore ? " (HC)" : ""}${p.ready ? " [Ready]" : ""}`)
		.join(", ");
	const themeLabel = (theme ?? "").trim() || "-";
	return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Guess The Song Report - ${esc(roomCode)}</title>
<style>
body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
h1,h2,h3 { margin: 0 0 8px 0; }
.meta { margin: 0 0 14px 0; font-size: 12px; color: #333; }
table { width: 100%; border-collapse: collapse; margin: 8px 0 18px 0; }
th, td { border: 1px solid #bbb; padding: 6px 8px; font-size: 12px; text-align: left; vertical-align: top; }
th { background: #eee; }
.section { margin-top: 12px; }
@media print { body { margin: 10mm; } }
</style>
</head>
<body>
<h1>Guess The Song - Game Report</h1>
<p class="meta">Room: <strong>${esc(roomCode)}</strong> | Exported: ${esc(exportedAt)}</p>
<p class="meta">Theme: <strong>${esc(themeLabel)}</strong> | Theme Revealed: ${themeData.revealed ? "Yes" : "No"} | Solved By: ${esc((themeData.solvedBy || []).join(", ") || "-")}</p>
<p class="meta">Players: ${esc(playersMeta || "-")}</p>

<div class="section">
<h2>Final Points</h2>
<table>
<thead><tr><th>Rank</th><th>Player</th><th>Points</th></tr></thead>
<tbody>${scoreRows}</tbody>
</table>
</div>

<div class="section">
<h2>Songs / Correct Answers</h2>
<table>
<thead><tr><th>#</th><th>Song</th><th>Submitter</th><th>Bonus Answer</th></tr></thead>
<tbody>${songsRows}</tbody>
</table>
</div>

<div class="section">
<h2>Player Guesses</h2>
${playerSections}
</div>
</body>
</html>`;
};

const normalizeSheetName = (value: string) =>
	value
		.replace(/[\\/:?*\[\]]/g, "")
		.trim()
		.slice(0, 31) || "Sheet";

async function exportWorkbook({
	roomCode,
	theme,
	scores,
	dashboard,
}: {
	roomCode: string;
	theme?: string;
	scores: Record<string, number>;
	dashboard: AdminDashboardPayload;
}) {
	const xlsx = await import("xlsx");
	const { utils, writeFile } = xlsx;
	const workbook = utils.book_new();
	const exportedAt = new Date().toLocaleString();
	const sortedScores = Object.entries(scores).sort(([, a], [, b]) => b - a);
	const playersMeta = dashboard.players
		.filter((player) => !player.isHost)
		.map((player) => `${player.name}${player.hardcore ? " (HC)" : ""}${player.ready ? " [Ready]" : ""}`)
		.join(", ");

	const summaryRows = [
		["Room", roomCode],
		["Exported", exportedAt],
		["Theme", (theme ?? "").trim() || "-"],
		["Theme Revealed", dashboard.theme.revealed ? "Yes" : "No"],
		["Solved By", (dashboard.theme.solvedBy ?? []).join(", ") || "-"],
		["Players", playersMeta || "-"],
		[],
		["Rank", "Player", "Points"],
		...sortedScores.map(([name, points], idx) => [idx + 1, name, points]),
	];
	utils.book_append_sheet(workbook, utils.aoa_to_sheet(summaryRows), "Summary");

	const playerMetaRows = [
		["Player", "Host", "Hardcore", "Ready", "Connected"],
		...dashboard.players.map((player) => [
			player.name,
			player.isHost ? "Yes" : "No",
			player.hardcore ? "Yes" : "No",
			player.ready ? "Yes" : "No",
			player.connected ? "Yes" : "No",
		]),
	];
	utils.book_append_sheet(workbook, utils.aoa_to_sheet(playerMetaRows), "Players");

	const songs = dashboard.playerHistories[0]?.rounds ?? [];
	const songsRows = [
		["#", "Song", "Submitter", "Bonus Answer"],
		...songs.map((row) => [
			row.songIndex,
			row.songTitle || "Untitled",
			row.correctAnswer || "-",
			row.detailCorrectAnswer || "-",
		]),
	];
	utils.book_append_sheet(workbook, utils.aoa_to_sheet(songsRows), "Songs");

	const guessRows = [
		[
			"Player",
			"#",
			"Song",
			"Guess",
			"Correct",
			"Locked",
			"Bonus Guess",
			"Bonus Correct",
			"Bonus Locked",
			"Theme Guess",
		],
		...dashboard.playerHistories.flatMap((history) =>
			history.rounds.map((round) => [
				history.playerName,
				round.songIndex,
				round.songTitle || "Untitled",
				round.guessLabel || "-",
				round.correctAnswer || "-",
				round.locked ? "Yes" : "No",
				round.detailGuessLabel || "-",
				round.detailCorrectAnswer || "-",
				round.detailLocked ? "Yes" : "No",
				round.themeGuess || "-",
			]),
		),
	];
	utils.book_append_sheet(workbook, utils.aoa_to_sheet(guessRows), "Guesses");

	for (const history of dashboard.playerHistories) {
		const playerRows = [
			[
				"#",
				"Song",
				"Guess",
				"Correct",
				"Locked",
				"Bonus Guess",
				"Bonus Correct",
				"Bonus Locked",
				"Theme Guess",
			],
			...history.rounds.map((round) => [
				round.songIndex,
				round.songTitle || "Untitled",
				round.guessLabel || "-",
				round.correctAnswer || "-",
				round.locked ? "Yes" : "No",
				round.detailGuessLabel || "-",
				round.detailCorrectAnswer || "-",
				round.detailLocked ? "Yes" : "No",
				round.themeGuess || "-",
			]),
		];
		utils.book_append_sheet(
			workbook,
			utils.aoa_to_sheet(playerRows),
			normalizeSheetName(history.playerName),
		);
	}

	writeFile(workbook, `guess-the-song-${roomCode}.xlsx`);
}

function toCsvCell(value: unknown) {
	const text = String(value ?? "");
	if (/[",\n]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}

function exportCsv({
	roomCode,
	theme,
	scores,
	dashboard,
}: {
	roomCode: string;
	theme?: string;
	scores: Record<string, number>;
	dashboard: AdminDashboardPayload;
}) {
	const finalPoints = new Map(Object.entries(scores));
	const players = new Map(dashboard.players.map((player) => [player.name, player]));
	const solvedTheme = new Set(dashboard.theme.solvedBy ?? []);
	const exportedAt = new Date().toLocaleString();
	const playersMeta = dashboard.players
		.filter((player) => !player.isHost)
		.map((player) => `${player.name}${player.hardcore ? " (HC)" : ""}${player.ready ? " [Ready]" : ""}`)
		.join(", ");
	const solvedByList = (dashboard.theme.solvedBy ?? []).join(", ") || "-";
	const rows = [
		[
			"Room",
			"Exported",
			"Theme",
			"Theme Revealed",
			"Solved By",
			"Players",
			"Player",
			"Final Points",
			"Hardcore",
			"Ready",
			"Connected",
			"Theme Solved",
			"Song #",
			"Song",
			"Submitter Guess",
			"Submitter Correct",
			"Submitter Locked",
			"Bonus Guess",
			"Bonus Correct",
			"Bonus Locked",
			"Theme Guess",
		],
		...dashboard.playerHistories.flatMap((history) =>
			history.rounds.map((round) => [
				roomCode,
				exportedAt,
				(theme ?? "").trim() || "-",
				dashboard.theme.revealed ? "Yes" : "No",
				solvedByList,
				playersMeta || "-",
				history.playerName,
				finalPoints.get(history.playerName) ?? 0,
				players.get(history.playerName)?.hardcore ? "Yes" : "No",
				players.get(history.playerName)?.ready ? "Yes" : "No",
				players.get(history.playerName)?.connected ? "Yes" : "No",
				solvedTheme.has(history.playerName) ? "Yes" : "No",
				round.songIndex,
				round.songTitle || "Untitled",
				round.guessLabel || "-",
				round.correctAnswer || "-",
				round.locked ? "Yes" : "No",
				round.detailGuessLabel || "-",
				round.detailCorrectAnswer || "-",
				round.detailLocked ? "Yes" : "No",
				round.themeGuess || "-",
			]),
		),
	];

	const csv = rows.map((row) => row.map(toCsvCell).join(",")).join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = `guess-the-song-${roomCode}.csv`;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

type ExportFormat = "pdf" | "excel" | "csv";

type ExportGameReportButtonProps = {
	code: string;
	scores: Record<string, number> | null | undefined;
	theme?: string;
	variant?: ButtonVariant;
	size?: ButtonSize;
	className?: string;
	label?: string;
};

export default function ExportGameReportButton({
	code,
	scores,
	theme,
	variant = "primary",
	size = "md",
	className,
	label = "Export",
}: ExportGameReportButtonProps) {
	const socket = useSocket();
	const [open, setOpen] = useState(false);
	const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

	useEffect(() => {
		if (!open) return;

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};

		window.addEventListener("keydown", handleEscape);

		return () => {
			window.removeEventListener("keydown", handleEscape);
		};
	}, [open]);

	const isBusy = exportingFormat !== null;
	const buttonLabel = useMemo(() => {
		if (exportingFormat === "pdf") return "Preparing PDF...";
		if (exportingFormat === "excel") return "Preparing Excel...";
		if (exportingFormat === "csv") return "Preparing CSV...";
		return label;
	}, [exportingFormat, label]);

	const fetchDashboardAndExport = (format: ExportFormat) => {
		if (isBusy || !code || !scores) return;
		setOpen(false);
		setExportingFormat(format);

		socket.emit("ADMIN_GET_DASHBOARD", { code }, async (res) => {
			if (!res.ok) {
				setExportingFormat(null);
				if (res.error === "NOT_AUTHORIZED") {
					toast.error("You can export after results are shown.");
					return;
				}
				toast.error("Failed to collect export data.");
				return;
			}

			try {
				if (format === "pdf") {
					const reportWindow = window.open("", "_blank");
					if (!reportWindow) {
						toast.error("Popup blocked. Allow popups to export PDF.");
						setExportingFormat(null);
						return;
					}

					reportWindow.document.write(
						"<p style='font-family: Arial, sans-serif;'>Preparing report...</p>",
					);
					reportWindow.document.close();

					const html = buildReportHtml({
						roomCode: code,
						theme,
						scores,
						dashboard: res.dashboard,
					});

					reportWindow.document.open();
					reportWindow.document.write(html);
					reportWindow.document.close();
					reportWindow.focus();
					setTimeout(() => {
						reportWindow.print();
					}, 250);
				} else if (format === "excel") {
					await exportWorkbook({
						roomCode: code,
						theme,
						scores,
						dashboard: res.dashboard,
					});
				} else {
					exportCsv({
						roomCode: code,
						theme,
						scores,
						dashboard: res.dashboard,
					});
				}
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Could not export report.",
				);
			} finally {
				setExportingFormat(null);
			}
		});
	};

	return (
		<>
			<Button
				variant={variant}
				size={size}
				onClick={() => setOpen((prev) => !prev)}
				disabled={!scores || isBusy}
				className={className}
				aria-expanded={open}
				aria-haspopup="menu"
			>
				{buttonLabel}
				<FiChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
			</Button>
			{open && !isBusy && (
				<div
					className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
					role="presentation"
					onMouseDown={() => setOpen(false)}
				>
					<section
						className="w-full max-w-xs rounded-lg border border-border bg-card p-4 text-text shadow-2xl"
						role="dialog"
						aria-modal="true"
						aria-label="Choose export format"
						onMouseDown={(event) => event.stopPropagation()}
					>
						<h2 className="text-base font-semibold">Export report</h2>
						<p className="mt-1 text-sm text-text-muted">
							Choose which format to export this game report as.
						</p>
						<div className="mt-4 space-y-2" role="menu">
					<button
						type="button"
								className="flex w-full items-center justify-center rounded-lg border border-border/70 bg-card/45 px-3 py-2 text-sm text-text transition-colors hover:bg-card/60"
						onClick={() => fetchDashboardAndExport("pdf")}
						role="menuitem"
					>
						Export as PDF
					</button>
					<button
						type="button"
								className="flex w-full items-center justify-center rounded-lg border border-border/70 bg-card/45 px-3 py-2 text-sm text-text transition-colors hover:bg-card/60"
						onClick={() => fetchDashboardAndExport("excel")}
						role="menuitem"
					>
						Export as Excel
					</button>
					<button
						type="button"
						className="flex w-full items-center justify-center rounded-lg border border-border/70 bg-card/45 px-3 py-2 text-sm text-text transition-colors hover:bg-card/60"
						onClick={() => fetchDashboardAndExport("csv")}
						role="menuitem"
					>
						Export as CSV
					</button>
						</div>
						<div className="mt-4 flex justify-end">
							<Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
								Cancel
							</Button>
						</div>
					</section>
				</div>
			)}
		</>
	);
}
