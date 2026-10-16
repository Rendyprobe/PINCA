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
  ...rest
}) => {
  const combinedClass = [
    styles.card,
    clickable ? styles.clickable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={combinedClass} {...rest}>
      {children}
    </div>
  );
};
