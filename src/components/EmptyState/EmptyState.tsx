import styles from './EmptyState.module.css'

type EmptyStateProps = {
  title: string
  description: string
}

const EmptyState = ({ title, description }: EmptyStateProps) => (
  <div className={styles.emptyState} role="status" aria-live="polite">
    <h2 className={styles.title}>{title}</h2>
    <p className={styles.description}>{description}</p>
  </div>
)

export default EmptyState