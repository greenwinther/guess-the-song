"use client";

import { useState } from "react";
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
				`<tr><td>${idx + 1}</td><td>${esc(name)}</td><td>${esc(points)}</td></tr>`
		)
		.join("");
	const songs = histories[0]?.rounds ?? [];
	const songsRows = songs
		.map(
			(row) =>
				`<tr><td>${row.songIndex}</td><td>${esc(row.songTitle || "Untitled")}</td><td>${esc(
					row.correctAnswer
				)}</td><td>${esc(row.detailCorrectAnswer || "-")}</td></tr>`
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
</tr>`
				)
				.join("");
			return `<h3>${esc(player.playerName)}</h3>
<table>
<thead><tr><th>#</th><th>Song</th><th>Guess</th><th>Correct</th><th>Locked</th><th>Bonus Guess</th><th>Bonus Correct</th><th>Bonus Locked</th></tr></thead>
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
	label = "Export PDF",
}: ExportGameReportButtonProps) {
	const socket = useSocket();
	const [exportingReport, setExportingReport] = useState(false);

	const onExportPdf = () => {
		if (exportingReport || !code || !scores) return;

		const reportWindow = window.open("", "_blank");
		if (!reportWindow) {
			toast.error("Popup blocked. Allow popups to export PDF.");
			return;
		}

		reportWindow.document.write("<p style='font-family: Arial, sans-serif;'>Preparing report...</p>");
		reportWindow.document.close();
		setExportingReport(true);

		socket.emit("ADMIN_GET_DASHBOARD", { code }, (res) => {
			setExportingReport(false);
			if (!res.ok) {
				reportWindow.close();
				if (res.error === "NOT_AUTHORIZED") {
					toast.error("You can export after results are shown.");
					return;
				}
				toast.error("Failed to collect report data.");
				return;
			}

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
		});
	};

	return (
		<Button
			variant={variant}
			size={size}
			onClick={onExportPdf}
			disabled={!scores || exportingReport}
			className={className}
		>
			{exportingReport ? "Preparing..." : label}
		</Button>
	);
}
