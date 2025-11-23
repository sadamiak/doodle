const normalize = (value: string | undefined) => value?.trim() ?? "";

const toNumber = (value: string | undefined, fallback: number) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

export const CHAT_API_BASE_URL =
  normalize(import.meta.env.VITE_CHAT_API_BASE_URL) || "http://localhost:3000";
export const CHAT_API_TOKEN =
  normalize(import.meta.env.VITE_CHAT_API_TOKEN) || "super-secret-doodle-token";
export const CHAT_POLL_INTERVAL = toNumber(import.meta.env.VITE_CHAT_POLL_INTERVAL, 5000);
export const CHAT_PAGE_LIMIT = toNumber(import.meta.env.VITE_CHAT_PAGE_LIMIT, 5);
