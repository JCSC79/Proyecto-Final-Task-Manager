import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Button, Intent } from '@blueprintjs/core';
import styles from './Footer.module.css';

// Custom SVG Icons
const SocialIcons = {
  X: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.socialSvg}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.13l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  Instagram: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.socialSvg}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  WhatsApp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.socialSvg}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
};

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.columnMain}>
          <div className={styles.appHeader}>
            <Icon icon="clipboard" size={20} intent={Intent.PRIMARY} />
            <h4 className={styles.appName}>{t('appName')}</h4>
          </div>
          <p className={styles.appDescription}>{t('descriptionText')}</p>
          <div className={styles.credits}>
            &copy; {currentYear} JCSC. {t('allRightsReserved')}
          </div>
        </div>

        <div className={styles.columnLinks}>
          <h5 className={styles.columnTitle}>{t('navigation')}</h5>
          <ul className={styles.linkList}>
            <li><a href="/">{t('home')}</a></li>
            <li><a href="/dashboard">{t('dashboard')}</a></li>
            <li><a href="/profile">{t('profile')}</a></li>
          </ul>
        </div>

        <div className={styles.columnLinks}>
          <h5 className={styles.columnTitle}>{t('resources')}</h5>
          <ul className={styles.linkList}>
            <li>
              <a href="https://github.com/JCSC79/proyecto-backend-fase1.git" target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                <svg className={styles.githubIcon} viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                {t('viewSource')}
              </a>
            </li>
            <li><a href="/terms" className={styles.placeholderLink}>{t('terms')}</a></li>
            <li><a href="/privacy" className={styles.placeholderLink}>{t('policy')}</a></li>
          </ul>
        </div>

        <div className={styles.columnLinks}>
          <h5 className={styles.columnTitle}>{t('connect')}</h5>
          <div className={styles.socialIcons}>
            <Button icon={<SocialIcons.X />} variant="minimal" aria-label="X (Twitter)"><span className="sr-only">X (Twitter)</span></Button>
            <Button icon={<SocialIcons.Instagram />} variant="minimal" aria-label="Instagram"><span className="sr-only">Instagram</span></Button>
            <Button icon={<SocialIcons.WhatsApp />} variant="minimal" aria-label="WhatsApp"><span className="sr-only">WhatsApp</span></Button>
          </div>
        </div>
      </div>
    </footer>
  );
};