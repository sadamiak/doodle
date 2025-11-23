import clsx from 'clsx'
import styles from './MessageSkeleton.module.css'

type MessageSkeletonProps = {
  align?: 'left' | 'right'
}

const MessageSkeleton = ({ align = 'left' }: MessageSkeletonProps) => (
  <div 
    className={clsx(styles.skeleton, align === 'right' && styles.right)}
    aria-hidden="true"
  >
    <div className={styles.body}>
      <div className={styles.line} />
      <div className={clsx(styles.line, styles.lineShort)} />
    </div>
  </div>
)

export default MessageSkeleton
