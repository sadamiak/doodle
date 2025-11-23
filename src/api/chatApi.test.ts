import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import type { Mock } from "vitest";

// Mock environment before importing the module
vi.mock("../config/environment", () => ({
  CHAT_API_BASE_URL: "https://api.example.com",
  CHAT_API_TOKEN: "test-token",
  CHAT_PAGE_LIMIT: 25,
}));

// Now import the module under test
import { mapMessage, fetchMessages, sendMessage } from "./chatApi.ts";
import type { RawMessage } from "../types/message";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
let fetchMock: Mock;

describe("chat.api", () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    g.fetch = fetchMock;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("mapMessage", () => {
    let originalDate: DateConstructor;

    beforeAll(() => {
      originalDate = Date;
      vi.useFakeTimers();
    });

    afterAll(() => {
      vi.useRealTimers();
      // restore Date if needed
      global.Date = originalDate;
    });

    it("maps a full RawMessage correctly and trims fields", () => {
      const raw: RawMessage = {
        _id: "123",
        author: "  Alice  ",
        message: "  Hello world  ",
        createdAt: "2025-01-01T00:00:00.000Z",
      };

      const mapped = mapMessage(raw);

      expect(mapped).toEqual({
        id: "123",
        author: "Alice",
        body: "Hello world",
        createdAt: "2025-01-01T00:00:00.000Z",
      });
    });

    it("uses defaults when author/message/createdAt are missing", () => {
      const fakeNow = new Date("2025-02-02T12:00:00.000Z");
      vi.setSystemTime(fakeNow);

      const raw = {
        _id: undefined,
        author: "    ",
        message: "",
        createdAt: undefined,
      } as unknown as RawMessage;

      const mapped = mapMessage(raw);

      expect(mapped.author).toBe("Anonymous Doodler");
      expect(mapped.body).toBe("");
      // createdAt should fall back to now
      expect(mapped.createdAt).toBe(fakeNow.toISOString());
      // id should be some stableIdentifier based on createdAt/author/body
      expect(typeof mapped.id).toBe("string");
      expect(mapped.id.length).toBeGreaterThan(0);
    });
  });

  describe("fetchMessages", () => {
    it("calls the API with default limit and maps messages from array payload", async () => {
      const rawMessages: RawMessage[] = [
        {
          _id: "1",
          author: "Alice",
          message: "Hello",
          createdAt: "2025-01-01T00:00:00.000Z",
        },
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(rawMessages),
      });
      const result = await fetchMessages();
      expect(g.fetch).toHaveBeenCalledTimes(1);
      const [urlArg, optionsArg] = fetchMock.mock.calls[0];

      // URL and query params
      expect(urlArg).toBeInstanceOf(URL);
      const url = urlArg as URL;
      expect(url.toString()).toContain("https://api.example.com/api/v1/messages");
      expect(url.searchParams.get("limit")).toBe("25");

      // Headers & signal
      expect(optionsArg).toMatchObject({
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        signal: undefined,
      });

      expect(result).toEqual([
        {
          id: "1",
          author: "Alice",
          body: "Hello",
          createdAt: "2025-01-01T00:00:00.000Z",
        },
      ]);
    });

    it("passes limit, before and after parameters", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });
      const controller = new AbortController();
      await fetchMessages({ limit: 10, before: "abc", after: "def", signal: controller.signal });

      const [urlArg, optionsArg] = fetchMock.mock.calls[0];
      const url = urlArg as URL;

      expect(url.searchParams.get("limit")).toBe("10");
      expect(url.searchParams.get("before")).toBe("abc");
      expect(url.searchParams.get("after")).toBe("def");
      expect(optionsArg.signal).toBe(controller.signal);
    });

    it("handles payloads with { data: RawMessage[] }", async () => {
      const raw: RawMessage = {
        _id: "2",
        author: "Bob",
        message: "Yo",
        createdAt: "2025-01-02T00:00:00.000Z",
      };

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [raw] }),
      });

      const result = await fetchMessages();
      expect(result[0]).toMatchObject({
        id: "2",
        author: "Bob",
        body: "Yo",
      });
    });

    it("handles payloads with { messages: RawMessage[] }", async () => {
      const raw: RawMessage = {
        _id: "3",
        author: "Carol",
        message: "Hi there",
        createdAt: "2025-01-03T00:00:00.000Z",
      };

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ messages: [raw] }),
      });

      const result = await fetchMessages();
      expect(result[0]).toMatchObject({
        id: "3",
        author: "Carol",
        body: "Hi there",
      });
    });

    it("handles payloads with { message: RawMessage }", async () => {
      const raw: RawMessage = {
        _id: "4",
        author: "Dave",
        message: "Single",
        createdAt: "2025-01-04T00:00:00.000Z",
      };

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: raw }),
      });

      const result = await fetchMessages();
      expect(result[0]).toMatchObject({
        id: "4",
        author: "Dave",
        body: "Single",
      });
    });

    it("throws on non-ok response", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(fetchMessages()).rejects.toThrow("Unable to fetch messages (500)");
    });
  });

  describe("sendMessage", () => {
    beforeAll(() => {
      // Make ID / time deterministic where needed
      vi.useFakeTimers();
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    it("POSTs the message and maps object payload with mapMessage", async () => {
      const input = { author: "Alice", message: "Hello" };

      const raw: RawMessage = {
        _id: "10",
        author: "Alice",
        message: "Hello",
        createdAt: "2025-01-01T00:00:00.000Z",
      };

      fetchMock.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(raw),
      });

      const result = await sendMessage(input);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [urlArg, optionsArg] = fetchMock.mock.calls[0];

      expect(urlArg.toString()).toBe("https://api.example.com/api/v1/messages");

      expect(optionsArg).toMatchObject({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
      });

      expect(optionsArg.body).toBe(JSON.stringify(input));

      expect(result).toEqual({
        id: "10",
        author: "Alice",
        body: "Hello",
        createdAt: "2025-01-01T00:00:00.000Z",
      });
    });

    it("handles array payload via parsePayload", async () => {
      const input = { author: "Bob", message: "Yo" };

      const rawArray: RawMessage[] = [
        {
          _id: "11",
          author: "Bob",
          message: "Yo",
          createdAt: "2025-01-02T00:00:00.000Z",
        },
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(rawArray),
      });

      const result = await sendMessage(input);
      expect(result).toMatchObject({
        id: "11",
        author: "Bob",
        body: "Yo",
      });
    });

    it("throws with response text on non-ok response with body", async () => {
      const input = { author: "Eve", message: "Oops" };

      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Bad Request"),
      });

      await expect(sendMessage(input)).rejects.toThrow("Bad Request");
    });

    it("throws with default error message when non-ok response has empty body", async () => {
      const input = { author: "Eve", message: "Oops" };

      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve(""),
      });

      await expect(sendMessage(input)).rejects.toThrow("Unable to send message right now");
    });
  });
});
