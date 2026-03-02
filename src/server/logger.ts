import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug");

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

export const logger = pino(
	{
		name: "guess-the-song-server",
		level,
		base: undefined,
		timestamp: pino.stdTimeFunctions.isoTime,
	},
	transport
);

export const scopedLogger = (scope: string) => logger.child({ scope });
