import React from 'react'
import clsx from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  clickable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, clickable = false, ...props }, ref) => (
    <div
      className={clsx(
        'bg-dark-card rounded-card shadow-card transition-all duration-200 hover:shadow-card-hover',
        clickable && 'cursor-pointer hover:scale-105',
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  )
)

Card.displayName = 'Card'

export default Card
