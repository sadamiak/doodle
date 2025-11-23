import MessageList from '../MessageList/MessageList'
import MessageComposer from '../MessageComposer/MessageComposer'
import styles from './ChatContainer.module.css'

const ChatContainer = () => {
  const error = {
    message: ""
  };
  const sendError = {
    message: ""
  };

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
        <MessageList />
        <MessageComposer/>
      </main>
    </div>
  )
}

export default ChatContainer