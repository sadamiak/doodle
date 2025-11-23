import clsx from 'clsx'
import type { Message } from '../../types/message'
import { formatTimestampLabel } from '../../utils/datetime'
import styles from './MessageBubble.module.css'


type MessageBubbleProps = {
  message: Message
  isOwn: boolean
  showAuthor: boolean
  showTimestamp: boolean
}

const MessageBubble = ({ message, isOwn, showAuthor, showTimestamp }: MessageBubbleProps) => {
  const timestamp = formatTimestampLabel(message.createdAt)
  const author = message.author
  
  return (
    <li 
      className={clsx(styles.row, isOwn && styles.isOwn)}
      aria-label={`Message from ${author}${showTimestamp ? ` at ${timestamp}` : ''}`}
    >
      <div 
        className={clsx(styles.bubble, isOwn && styles.bubbleOwn)}
        role="article"
      >
        {showAuthor && !isOwn && (
          <p className={styles.author} aria-label="Author">
            {author}
          </p>
        )}
        <p className={styles.body}>{message.body}</p>
        {showTimestamp && (
          <p className={styles.meta}>
            <time dateTime={new Date(message.createdAt).toISOString()}>
              {timestamp}
            </time>
          </p>
        )}
      </div>
    </li>
  )
}
export default MessageBubble