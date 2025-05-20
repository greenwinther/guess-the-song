// # Home page ("/")
// src/pages/_app.tsx
import type { AppProps } from "next/app";
import { SocketProvider } from "../context/SocketContext";
import "../styles/globals.css";
import { GameProvider } from "@/context/GameContext";

export default function App({ Component, pageProps }: AppProps) {
	return (
		<GameProvider>
			<SocketProvider serverUrl="http://localhost:3001">
				<Component {...pageProps} />
			</SocketProvider>
		</GameProvider>
	);
}
