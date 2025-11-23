import { useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import type { Message } from '../../types/message'
import MessageBubble from '../MessageBubble/MessageBubble'
import  EmptyState from '../EmptyState/EmptyState'
import MessageSkeleton from '../MessageSkeleton/MessageSkeleton'
import styles from './MessageList.module.css'

export type MessageListProps = {
  messages: Message[]
  currentAuthor: string
  isLoading: boolean
  isFetchingOlder?: boolean
  hasOlderMessages?: boolean
  onLoadOlder?: () => void | Promise<void>
}

const normalize = (value: string) => value.trim().toLowerCase()

const MessageList = ({ 
  messages, 
  currentAuthor, 
  isLoading,
  isFetchingOlder = false,
  hasOlderMessages = false,
  onLoadOlder
}: MessageListProps) => {
  const listRef = useRef<HTMLDivElement>(null)
  const hasScrolledRef = useRef(false)
  const previousScrollHeightRef = useRef(0)
  const previousScrollTopRef = useRef(0)
  const shouldRestoreScrollRef = useRef(false)
  const stickToBottomRef = useRef(true)
  const scrollRafRef = useRef<number | null>(null)

  useEffect(() => {
    if (isLoading) {
      hasScrolledRef.current = false
      stickToBottomRef.current = true
    }
  }, [isLoading])

  useLayoutEffect(() => {
    if (!listRef.current || messages.length === 0 || isFetchingOlder) {
      return
    }

    if (!stickToBottomRef.current && hasScrolledRef.current) {
      return
    }

    requestAnimationFrame(() => {
      if (!listRef.current) return
      listRef.current.scrollTop = listRef.current.scrollHeight
      hasScrolledRef.current = true
    })
  }, [messages, isFetchingOlder])

  useEffect(() => {
    if (isFetchingOlder && listRef.current) {
      previousScrollHeightRef.current = listRef.current.scrollHeight;
      previousScrollTopRef.current = listRef.current.scrollTop;
      shouldRestoreScrollRef.current = true;
    }
  }, [isFetchingOlder]);

  useEffect(() => {
    if (
      !shouldRestoreScrollRef.current ||
      isFetchingOlder ||
      !listRef.current ||
      !previousScrollHeightRef.current
    ) {
      return;
    }

    const newScrollHeight = listRef.current.scrollHeight;
    const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
    listRef.current.scrollTop = previousScrollTopRef.current + scrollDiff;

    previousScrollHeightRef.current = 0;
    shouldRestoreScrollRef.current = false;
  }, [isFetchingOlder, messages]);

  const handleScroll = useCallback(() => {
    if (!listRef.current || scrollRafRef.current !== null) {
      return
    }

    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null
      if (!listRef.current) {
        return
      }

      const { scrollTop, scrollHeight, clientHeight } = listRef.current
      const topThreshold = 100
      const bottomThreshold = 80

      const distanceFromBottom = scrollHeight - clientHeight - scrollTop
      stickToBottomRef.current = distanceFromBottom < bottomThreshold

      if (!onLoadOlder || !hasOlderMessages || isFetchingOlder) {
        return
      }

      if (scrollTop < topThreshold) {
        onLoadOlder()
      }
    })
  }, [onLoadOlder, hasOlderMessages, isFetchingOlder])

  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    listElement.addEventListener('scroll', handleScroll);
    return () => listElement.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (
      !listRef.current ||
      !onLoadOlder ||
      !hasOlderMessages ||
      isFetchingOlder
    ) {
      return;
    }

    const { scrollHeight, clientHeight } = listRef.current;
    const hasOverflow = scrollHeight - clientHeight > 4;

    if (!hasOverflow) {
      void onLoadOlder();
    }
  }, [messages, hasOlderMessages, isFetchingOlder, onLoadOlder]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current)
      }
    }
  }, [])

  if (isLoading && !messages.length) {
    return (
      <div 
        ref={listRef} 
        className={styles.list} 
        role="status" 
        aria-live="polite"
        aria-label="Loading messages"
      >
        <MessageSkeleton />
        <MessageSkeleton align="right" />
        <MessageSkeleton />
      </div>
    )
  }

  if (!messages.length) {
    return (
      <div 
        ref={listRef} 
        className={styles.list}
        role="status"
      >
        <EmptyState
          title="No messages yet"
          description="Say hello to kick off the conversation."
        />
      </div>
    )
  }

  return (
    <div 
      ref={listRef} 
      className={styles.list} 
      role="log" 
      aria-live="polite"
      aria-label="Chat messages"
      aria-atomic="false"
    >
      {isFetchingOlder && (
        <div className={styles.loadingOlder} role="status" aria-label="Loading older messages">
          <MessageSkeleton />
        </div>
      )}
      <ul aria-label={`${messages.length} message${messages.length === 1 ? '' : 's'}`}>
        {messages.map((message, index) => {
          const previous = messages[index - 1]
          const normalizedAuthor = normalize(message.author)
          const isOwn = normalizedAuthor === normalize(currentAuthor)
          const showAuthor = !previous || normalize(previous.author) !== normalizedAuthor
          const showTimestamp = true

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={isOwn}
              showAuthor={showAuthor}
              showTimestamp={showTimestamp}
            />
          )
        })}
      </ul>
      <div className={styles.spacer} aria-hidden="true" />
    </div>
  )
}

export default MessageList