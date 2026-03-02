import pino from "pino";
import { serverConfig } from "./config";

const isProduction = serverConfig.isProduction;
const level = serverConfig.logLevel;

const transport = isProduction
	? undefined
	: pino.transport({
			target: "pino-pretty",
			options: {
				colorize: true,
				translateTime: "SYS:standard",
				ignore: "pid,hostname",
				singleLine: true,
			},
	  });

const logger = pino(
	{
		name: "guess-the-song-server",
		level,
		base: undefined,
		timestamp: pino.stdTimeFunctions.isoTime,
	},
	transport
);

export const scopedLogger = (scope: string) => logger.child({ scope });
