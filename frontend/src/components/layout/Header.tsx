import React, { useEffect, useState } from 'react';
import { Navbar, ProgressBar, Button, Alignment, Dialog, DialogBody, DialogFooter, InputGroup, FormGroup, Intent } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { gravatarUrl } from '../../utils/gravatar';
import { AppToaster } from '../../utils/toaster';
import logoImg from '../../assets/logo.png';
import styles from './Header.module.css';

type ViewMode = 'home' | 'dashboard';

interface HeaderProps {
  progress: number;
  activeView: ViewMode | 'admin';
  setActiveView: (view: ViewMode) => void;
  showProgress?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  progress,
  activeView,
  setActiveView,
  showProgress = true }) => {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { user, isAdmin, logout, updateName } = useAuth();
  const navigate = useNavigate();
  const percentage = Math.round(progress * 100);

  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.email) {
      gravatarUrl(user.email, 36).then(setAvatarSrc);
    } else {
      setAvatarSrc(null);
    }
  }, [user?.email]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es');
  };

  const openEdit = () => {
    setNameInput(user?.name ?? '');
    setIsEditOpen(true);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      await updateName(nameInput.trim());
      setIsEditOpen(false);
      AppToaster.show({ message: t('editProfileSuccess'), intent: Intent.SUCCESS });
    } catch {
      AppToaster.show({ message: t('loginError'), intent: Intent.DANGER });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Navbar className={styles.navbar}>
      <Navbar.Group align={Alignment.LEFT} className={styles.navGroup}>

        {/* Branding */}
        <div className={styles.branding}>
          <img src={logoImg} alt="App Logo" className={styles.logo} />
          <Navbar.Heading>
            <span className={styles.appName}>{t('appName')}</span>
          </Navbar.Heading>
        </div>

        <Navbar.Divider />

        {/* View switcher */}
        <div className={styles.viewSwitcher}>
          <Button
            minimal
            icon="home"
            text={t('home')}
            active={activeView === 'home'}
            onClick={() => setActiveView('home')}
            large
          />
          <Button
            minimal
            icon="dashboard"
            text={t('dashboard')}
            active={activeView === 'dashboard'}
            onClick={() => setActiveView('dashboard')}
            large
          />
          {isAdmin && (
            <Button
              minimal
              icon="shield"
              text={t('adminPanel')}
              intent="warning"
              onClick={() => navigate('/admin')}
              large
            />
          )}
        </div>

        {/* Progress */}
        {showProgress && (
          <div className={styles.progressSection}>
            <span className={styles.progressLabel}>
              {t('progress')}: {percentage}%
            </span>
            <ProgressBar
              className={styles.progressBar}
              intent={percentage === 100 ? 'success' : 'primary'}
              value={progress}
              stripes={false}
              animate={false}
            />
          </div>
        )}
        <Navbar.Divider />

        {/* User info + controls */}
        <div className={styles.settingsSection}>
          {user && (
            <div className={styles.userInfo}>
              <button
                className={styles.avatarBtn}
                onClick={openEdit}
                aria-label={t('editProfileTitle')}
                title={t('editProfileTitle')}
              >
                {avatarSrc && (
                  <img
                    src={avatarSrc}
                    alt={user.name ?? user.email}
                    className={styles.avatar}
                  />
                )}
              </button>
              <span>{user.name ?? user.email}</span>
              <span className={styles.userRole}>{isAdmin ? 'Admin' : 'User'}</span>
            </div>
          )}
          <Button minimal icon={isDark ? 'flash' : 'moon'} onClick={toggleTheme} large />
          <Button minimal onClick={toggleLanguage} large>
            {i18n.language.startsWith('es')
              ? <><span className="fi fi-es" style={{ marginRight: 6 }} />ES</>
              : <><span className="fi fi-gb" style={{ marginRight: 6 }} />EN</>}
          </Button>
          {user && <Button minimal icon="log-out" onClick={logout} large />}
        </div>

      </Navbar.Group>

      {/* Edit profile dialog */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={t('editProfileTitle')}
        style={{ width: 360 }}
      >
        <DialogBody>
          <FormGroup label={t('editProfileName')} labelFor="editName">
            <InputGroup
              id="editName"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); }}
              large
              autoFocus
            />
          </FormGroup>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button onClick={() => setIsEditOpen(false)}>{t('cancel')}</Button>
              <Button
                intent={Intent.PRIMARY}
                loading={isSaving}
                onClick={handleSaveName}
                disabled={!nameInput.trim()}
              >
                {t('editProfileSave')}
              </Button>
            </>
          }
        />
      </Dialog>

    </Navbar>
  );
};