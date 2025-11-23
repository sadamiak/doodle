import { CHAT_API_BASE_URL, CHAT_API_TOKEN, CHAT_PAGE_LIMIT } from "../config/environment";
import type { Message, RawMessage, SendMessageInput } from "../types/message";

const ensureBaseUrl = (path: string) => new URL(path, CHAT_API_BASE_URL).toString();

const defaultHeaders: Record<string, string> = {
  "Content-Type": "application/json",
};

if (CHAT_API_TOKEN) {
  defaultHeaders.Authorization = `Bearer ${CHAT_API_TOKEN}`;
}

export const mapMessage = (raw: RawMessage): Message => {
  const firstNonEmpty = (...values: Array<string | undefined | null>) =>
    values.find((value) => !!value && value.trim().length > 0)?.trim();

  const timestamp = firstNonEmpty(raw.createdAt);

  const messageBody = firstNonEmpty(raw.message) ?? "";
  const author = firstNonEmpty(raw.author) ?? "Anonymous Doodler";

  const stableIdentifier = `${timestamp ?? ""}-${author}-${messageBody}`;
  const fallbackId =
    firstNonEmpty(raw._id, (raw as { _id?: string })._id, stableIdentifier) ?? stableIdentifier;

  return {
    id: raw._id ?? fallbackId,
    author,
    body: messageBody,
    createdAt: timestamp ?? new Date().toISOString(),
  };
};

const parsePayload = (payload: unknown): RawMessage[] => {
  if (Array.isArray(payload)) {
    return payload as RawMessage[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data as RawMessage[];
    }
    if (Array.isArray(record.messages)) {
      return record.messages as RawMessage[];
    }
    if (record.message && typeof record.message === "object") {
      return [record.message as RawMessage];
    }
  }

  return [];
};

type FetchMessagesOptions = {
  limit?: number;
  before?: string;
  after?: string;
  signal?: AbortSignal;
};

export const fetchMessages = async (options: FetchMessagesOptions = {}): Promise<Message[]> => {
  const { limit = CHAT_PAGE_LIMIT, before, after, signal } = options;
  const url = new URL("/api/v1/messages", CHAT_API_BASE_URL);
  if (limit > 0) {
    url.searchParams.set("limit", String(limit));
  }
  if (before) {
    url.searchParams.set("before", before);
  }
  if (after) {
    url.searchParams.set("after", after);
  }

  const response = await fetch(url, {
    headers: defaultHeaders,
    signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch messages (${response.status})`);
  }

  const payload = await response.json();
  const rawMessages = parsePayload(payload);

  return rawMessages.map(mapMessage);
};

export const sendMessage = async (input: SendMessageInput): Promise<Message> => {
  const url = ensureBaseUrl("/api/v1/messages");

  const response = await fetch(url, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({
      author: input.author,
      message: input.message,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to send message right now");
  }

  const payload = await response.json();
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return mapMessage(payload as RawMessage);
  }

  const [first] = parsePayload(payload);
  return mapMessage(
    first ?? {
      ...input,
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
    }
  );
};
