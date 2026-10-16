import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'ghost';
  size?: 'normal' | 'large' | 'icon';
  ariaLabel?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'large',
  ariaLabel,
  className,
  children,
  ...rest
}) => {
  const variantClass = styles[variant] ?? styles.primary;
  const sizeClass =
    size === 'icon'
      ? styles.sizeIcon
      : size === 'normal'
        ? styles.sizeNormal
        : styles.sizeLarge;

  const combinedClass = [styles.button, variantClass, sizeClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={combinedClass}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </button>
  );
};
