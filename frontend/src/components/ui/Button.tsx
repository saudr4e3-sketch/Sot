import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  children?: React.ReactNode
  loading?: boolean
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-accent-terracotta text-white hover:bg-accent-terracotta/90',
  secondary: 'bg-dark-card text-text-primary hover:bg-dark-card/90',
  tertiary: 'bg-transparent text-text-primary',
  danger: 'bg-status-error text-white',
  success: 'bg-green-600 text-white',
}

export default function Button({
  children,
  className = '',
  size = 'md',
  variant = 'primary',
  loading = false,
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded-lg font-semibold disabled:opacity-60 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`

  return (
    <button {...props} disabled={loading || props.disabled} className={classes}>
      {loading ? '...' : children}
    </button>
  )
}
