import React from 'react'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
}

export default function Button({ children, className = '', size = 'md', ...props }: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded-lg font-semibold disabled:opacity-60 ${sizeClasses[size]} ${className}`
  return (
    <button {...props} className={classes}>
      {children}
    </button>
  )
}
