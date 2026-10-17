import React from 'react';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  clickable?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  clickable = false,
  className,
  children,
  onKeyDown,
  ...rest
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      rest.onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
    onKeyDown?.(e);
  };

  const combinedClass = [
    styles.card,
    clickable ? styles.clickable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={combinedClass}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </div>
  );
};
