import React from 'react'
import clsx from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-btn font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-terracotta'
    
    const variantStyles = {
      primary: 'bg-accent-terracotta hover:bg-accent-terracotta-hover text-white shadow-btn hover:shadow-lg',
      secondary: 'bg-dark-card hover:bg-dark-bg-alt border-2 border-accent-terracotta text-accent-terracotta',
      tertiary: 'bg-transparent hover:bg-dark-card text-text-secondary hover:text-text-primary',
      danger: 'bg-status-error hover:bg-red-600 text-white',
      success: 'bg-status-success hover:bg-green-600 text-white',
    }
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }
    
    return (
      <button
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          loading && 'opacity-75 cursor-wait',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className="inline-block animate-spin mr-2">⟳</span>}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
