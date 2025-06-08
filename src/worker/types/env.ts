export interface Env {
	devDB: D1Database;
	prodDB: D1Database;
	TURNSTILE_SECRET?: string;
	LLM_API_KEY: string;
	LLM_API_ENDPOINT: string;
	LLM_MODEL: string;
	LLM_DATA_TAG: string;
	NOTIFICATION_TELEGRAM_BOT_TOKEN: string;
	NOTIFICATION_TELEGRAM_CHAT_ID: string;
}
