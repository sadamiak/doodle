import { useState } from 'react'
import type { FormEvent } from 'react'
import clsx from 'clsx'
import styles from './MessageComposer.module.css'

const MIN_MESSAGE_LENGTH = 1

type MessageComposerProps = {
  onSend: (message: string) => Promise<void>
  sending: boolean
}

const MessageComposer = ({ onSend, sending }: MessageComposerProps) => {
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  const handleBodyChange = (value: string) => {
    if (error && value.trim().length >= MIN_MESSAGE_LENGTH) {
      setError('')
    }
    setBody(value)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const trimmedBody = body.trim()

    if (trimmedBody.length < MIN_MESSAGE_LENGTH) {
      setError('Enter a message to send')
      return
    }

    try {
      await onSend(trimmedBody)
      setBody('')
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Something went wrong'
      setError(reason)
    }
  }

  const isDisabled = sending || body.trim().length < MIN_MESSAGE_LENGTH

  return (
    <form className={styles.composer} onSubmit={handleSubmit} aria-label="Send a message">
      {error && (
        <p id="composer-error" className={styles.error} role="alert" aria-live="assertive">
          {error}
        </p>
      )}

      <div className={styles.fields}>
        <label className={clsx(styles.label, styles.labelFull)}>
          <span className="sr-only">Message text</span>
          <textarea
            value={body}
            onChange={(event) => handleBodyChange(event.target.value)}
            placeholder="Message"
            rows={1}
            required
            minLength={MIN_MESSAGE_LENGTH}
            maxLength={500}
            disabled={sending}
            aria-label="Message text"
            aria-describedby={error ? "composer-error" : undefined}
            {...(error && { "aria-invalid": "true" })}
          />
        </label>

        <div className={styles.actions}>
          <button 
            type="submit"
            disabled={isDisabled}
            aria-label={sending ? "Sending message..." : "Send message"}
            {...(sending && { "aria-busy": "true" })}
          >
            Send
          </button>
        </div>
      </div>
    </form>
  )
}
export default MessageComposer