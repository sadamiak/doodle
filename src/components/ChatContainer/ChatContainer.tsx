import MessageList from '../MessageList/MessageList'
import MessageComposer from '../MessageComposer/MessageComposer'
import { useChatMessages } from '../../hooks/useChatMessages'
import styles from './ChatContainer.module.css'

const DEFAULT_AUTHOR = 'Szymon Adamiak'

const ChatContainer = () => {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    sending,
    sendError,
    fetchOlderMessages,
    hasOlderMessages,
    isFetchingOlder,
  } = useChatMessages()
  const author = DEFAULT_AUTHOR;

  const handleSend = async (body: string) => {
    await sendMessage({
      author: author.trim() || DEFAULT_AUTHOR,
      message: body,
    })
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1>Chit Chat app</h1>
      </header>

      {(error || sendError) && (
        <div 
          className={styles.errorBanner} 
          role="alert" 
          aria-live="assertive"
        >
          {error?.message ?? sendError?.message}
        </div>
      )}

      <main id="main-content" className={styles.card} aria-label="Chat conversation">
        <MessageList 
          messages={messages} 
          currentAuthor={author} 
          isLoading={isLoading}
          isFetchingOlder={isFetchingOlder}
          hasOlderMessages={hasOlderMessages}
          onLoadOlder={fetchOlderMessages}
        />
        <MessageComposer
          onSend={handleSend}
          sending={sending}
        />
      </main>
    </div>
  )
}

export default ChatContainer