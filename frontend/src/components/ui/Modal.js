"use client";

import { useEffect } from 'react';
import styles from '@/styles/components/ui/modal.module.scss';
import headerStyles from '@/styles/components/layout/Header.module.scss';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      const header = document.querySelector('header');
      if (header) {
        header.setAttribute('data-modal-open', 'true');
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      const header = document.querySelector('header');
      if (header) {
        header.setAttribute('data-modal-open', 'false');
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className={styles.modal__overlay} 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className={styles.modal__content}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.modal__header}>
          <h2 className={styles.modal__title}>{title}</h2>
          <button 
            onClick={onClose}
            className={styles.modal__close}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div className={styles.modal__body}>
          {children}
        </div>
      </div>
    </div>
  );
} 