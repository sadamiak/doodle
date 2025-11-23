import { useCallback, useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { fetchMessages, sendMessage } from "../api/chatApi";
import type { Message, SendMessageInput } from "../types/message";
import { CHAT_POLL_INTERVAL } from "../config/environment";

export const useChatMessages = () => {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["messages"],
    queryFn: ({ pageParam, signal }) =>
      fetchMessages(pageParam ? { before: pageParam, signal } : { signal }),
    getNextPageParam: (lastPage) => {
      // Get the oldest message from the last page for pagination
      if (lastPage.length === 0) return undefined;
      const oldest = lastPage[lastPage.length - 1];
      return oldest?.createdAt;
    },
    initialPageParam: undefined as string | undefined,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: CHAT_POLL_INTERVAL,
  });

  const messages: Message[] = useMemo(() => {
    if (!query.data?.pages) {
      return [];
    }

    const allMessages = query.data.pages.flat();
    const uniqueMessages = new Map<string, Message>();

    allMessages.forEach((msg) => {
      uniqueMessages.set(msg.id, msg);
    });

    return Array.from(uniqueMessages.values()).sort(
      (first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
    );
  }, [query.data]);

  const latestMessageTimestampRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    latestMessageTimestampRef.current = messages[messages.length - 1]?.createdAt;
  }, [messages]);

  const refetchLatestPage = useCallback(async () => {
    const latestTimestamp = latestMessageTimestampRef.current;
    const latestMessages = await fetchMessages(
      latestTimestamp ? { after: latestTimestamp } : undefined
    );

    if (latestMessages.length === 0) {
      return;
    }

    queryClient.setQueryData<InfiniteData<Message[]>>(["messages"], (previous) => {
      if (!previous) {
        return {
          pages: [latestMessages],
          pageParams: [undefined],
        };
      }

      const [firstPage = [], ...restPages] = previous.pages;

      return {
        pages: [[...firstPage, ...latestMessages], ...restPages],
        pageParams: previous.pageParams,
      };
    });
  }, [queryClient]);

  useEffect(() => {
    if (CHAT_POLL_INTERVAL <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refetchLatestPage();
    }, CHAT_POLL_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [refetchLatestPage]);

  useEffect(() => {
    const handleFocus = () => {
      void refetchLatestPage();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetchLatestPage]);

  const mutation = useMutation({
    mutationFn: (input: SendMessageInput) => sendMessage(input),
    onSuccess: async () => {
      await refetchLatestPage();
    },
  });

  return {
    ...query,
    messages,
    sendMessage: mutation.mutateAsync,
    sending: mutation.isPending,
    sendError: mutation.error as Error | null,
    fetchOlderMessages: async () => {
      if (!query.hasNextPage || query.isFetchingNextPage) {
        return;
      }

      await query.fetchNextPage();
    },
    hasOlderMessages: query.hasNextPage,
    isFetchingOlder: query.isFetchingNextPage,
  };
};
