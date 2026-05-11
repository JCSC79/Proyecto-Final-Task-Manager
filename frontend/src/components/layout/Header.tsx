import React, { useEffect, useState } from 'react';
import {
  Navbar,
  ProgressBar,
  Button,
  Alignment,
  Drawer,
  Divider,
  Position
} from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme.ts';
import { useAuth } from '../../hooks/useAuth.ts';
import { gravatarUrl } from '../../utils/gravatar';
import logoImg from '../../assets/Logo.png';
import { EditProfileDialog } from './EditProfileDialog';
import { useLanguageToggle } from '../../hooks/useLanguageToggle';
import styles from './Header.module.css';

type ViewMode = 'home' | 'dashboard';

interface NavProps {
  activeView: string;
  setActiveView: (view: ViewMode) => void;
  setIsMenuOpen: (open: boolean) => void;
  isAdmin: boolean;
  t: (key: string) => string;
  navigate: (path: string) => void;
}

/**
 * Navigation buttons component for reuse in Desktop and Mobile views
 */
const NavigationButtons: React.FC<NavProps> = ({
  activeView,
  setActiveView,
  setIsMenuOpen,
  isAdmin,
  t,
  navigate
}) => (
  <div className={styles.navButtonsContainer}>
    <Button
      variant="minimal"
      icon="home"
      text={t('home')}
      active={activeView === 'home'}
      onClick={() => {
        setActiveView('home');
        navigate('/');
        setIsMenuOpen(false);
      }}
    />
    <Button
      variant="minimal"
      icon="dashboard"
      text={t('dashboard')}
      active={activeView === 'dashboard'}
      onClick={() => {
        setActiveView('dashboard');
        setIsMenuOpen(false);
      }}
    />
    {isAdmin && (
      <Button
        variant="minimal"
        icon="shield"
        text={t('adminPanel')}
        intent="warning"
        onClick={() => {
          navigate('/admin');
          setIsMenuOpen(false);
        }}
      />
    )}
  </div>
);

export const Header: React.FC<{
  progress: number;
  activeView: ViewMode | 'admin';
  setActiveView: (view: ViewMode) => void;
  showProgress?: boolean;
}> = ({ progress, activeView, setActiveView, showProgress = true }) => {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { toggleLanguage, isSpanish } = useLanguageToggle();

  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const percentage = Math.round(progress * 100);

  useEffect(() => {
    if (user?.email) {
      gravatarUrl(user.email, 80).then(setAvatarSrc);
    }
  }, [user?.email]);

  const handleBrandingClick = (): void => {
    setActiveView('home');
    navigate('/');
  };

  return (
    <Navbar className={styles.navbar}>
      <Navbar.Group align={Alignment.START}>
        <div
          className={styles.branding}
          onClick={handleBrandingClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleBrandingClick()}
          aria-label={t('appName')}
        >
          <img src={logoImg} alt="" className={styles.logo} />
          <span className={styles.appName}>{t('appName')}</span>
        </div>
      </Navbar.Group>

      {/* DESKTOP VIEW */}
      <Navbar.Group align={Alignment.END} className={styles.desktopOnly}>
        <NavigationButtons
          activeView={activeView}
          setActiveView={setActiveView}
          setIsMenuOpen={setIsMenuOpen}
          isAdmin={isAdmin}
          t={t}
          navigate={navigate}
        />
        
        <Divider />
        
        {showProgress && (
          <div className={styles.progressSection}>
            {/* Added descriptive text to percentage */}
            <span className={styles.progressLabel}>
              <span className={styles.progressTextDesktop}>{t('progress')}: </span>
              {percentage}%
            </span>
            <ProgressBar
              intent={progress === 1 ? 'success' : 'primary'}
              value={progress}
              stripes={false}
              animate={false}
              className={styles.desktopProgressBar}
            />
          </div>
        )}

        <Divider />

        <div className={styles.desktopUserActions}>
          <Button variant="minimal" icon={isDark ? 'flash' : 'moon'} onClick={toggleTheme} aria-label={t('theme')} />
          
          <Button variant="minimal" onClick={toggleLanguage} className={styles.langButton}>
            {/* Wrapper to ensure horizontal alignment of flag and text */}
            <div className={styles.langButtonContent}>
              <span className={`fi fi-${isSpanish ? 'es' : 'gb'} ${styles.flagIcon}`} />
              <span>{isSpanish ? 'ES' : 'EN'}</span>
            </div>
          </Button>
          
          <Divider />

          <div className={styles.userInfoDesktop}>
            <span className={styles.userNameDesktop}>{user?.name || user?.email}</span>
            <button className={styles.avatarBtn} onClick={() => setIsEditOpen(true)} aria-label={t('editProfileTitle')}>
              {avatarSrc && <img src={avatarSrc} className={styles.avatar} alt="User" />}
            </button>
          </div>

          <Button variant="minimal" icon="log-out" onClick={logout} aria-label={t('logout')} />
        </div>
      </Navbar.Group>

      {/* MOBILE TRIGGER VIEW */}
      <Navbar.Group align={Alignment.END} className={styles.mobileMenuBtn}>
        <div className={styles.mobileTriggerWrapper}>
          <button className={styles.avatarBtn} onClick={() => setIsEditOpen(true)} aria-label={t('editProfileTitle')}>
            {avatarSrc && <img src={avatarSrc} className={styles.avatar} alt="" />}
          </button>
          <Button
            variant="minimal"
            icon="menu"
            onClick={() => setIsMenuOpen(true)}
            className={styles.menuToggle}
            aria-label={t('navigation')}
          >
            <span className="sr-only">{t('navigation')}</span>
          </Button>
        </div>
      </Navbar.Group>

      {/* MOBILE DRAWER */}
      <Drawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title={t('appName')}
        icon="menu"
        position={Position.RIGHT}
        size="320px"
        className={styles.customDrawer}
      >
        <div className={styles.mobileMenuContent}>
          <div className={styles.mobileUserInfo}>
            {avatarSrc && <img src={avatarSrc} className={styles.avatarLarge} alt="User" />}
            <h3 className={styles.userName}>{user?.name || user?.email}</h3>
            <span className={styles.userRole}>{isAdmin ? 'Admin' : 'User'}</span>
            <Button
              variant="minimal"
              icon="edit"
              text={t('editProfileTitle')}
              onClick={() => {
                setIsMenuOpen(false);
                setIsEditOpen(true);
              }}
              className={styles.editProfileBtn}
            />
          </div>

          <NavigationButtons
            activeView={activeView}
            setActiveView={setActiveView}
            setIsMenuOpen={setIsMenuOpen}
            isAdmin={isAdmin}
            t={t}
            navigate={navigate}
          />

          <Divider />

          <div className={styles.drawerSettings}>
            <Button
              size="large"
              fill
              icon={isDark ? 'flash' : 'moon'}
              text={t('theme')}
              onClick={toggleTheme}
            />
            <Button
              size="large"
              fill
              onClick={toggleLanguage}
              icon="translate"
              text={isSpanish ? 'English' : 'Español'}
            />
          </div>

          <Divider />
          
          <div className={styles.logoutWrapper}>
            <Button
              size="large"
              fill
              intent="danger"
              icon="log-out"
              text={t('logout') || 'Logout'}
              onClick={logout}
            />
          </div>
        </div>
      </Drawer>

      <EditProfileDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </Navbar>
  );
};