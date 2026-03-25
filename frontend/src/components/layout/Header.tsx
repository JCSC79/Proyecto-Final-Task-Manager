import React from 'react';
import {
  Navbar,
  ProgressBar,
  Button,
  Alignment,
  Tag,
  Intent,
  Popover,
  Menu,
  MenuItem,
  MenuDivider
} from "@blueprintjs/core";
import { useTranslation } from 'react-i18next';
import logoImg from '../../assets/logo.png';

/**
 * Header Component - Phase 6 Hardened Version
 * Provides Role-Based UI elements. 
 * The Admin tab and specific branding (Crown) are strictly tied to the verified userRole.
 */
interface HeaderProps {
  progress: number;
  isDark: boolean;
  toggleDark: () => void;
  activeView: string;
  setActiveView: (view: any) => void;
  userEmail: string;
  userName: string | null;
  userAvatar: string | null;
  userRole: string;
  onLogout: () => void;
  onEditProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  progress,
  isDark,
  toggleDark,
  activeView,
  setActiveView,
  userEmail,
  userName,
  userAvatar,
  userRole,
  onLogout,
  onEditProfile
}) => {
  const { t, i18n } = useTranslation();
  const percentage = Math.round(progress * 100);

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  const displayIdentifier = userName || userEmail;

  /**
   * RBAC CHECK:
   * We use strict equality to ensure 'isAdmin' is only true for the ADMIN role.
   */
  const isAdmin = userRole === 'ADMIN';

  const userMenu = (
    <Menu>
      <MenuItem
        icon="user"
        text={t('editProfile') || 'Edit Profile'}
        onClick={onEditProfile}
      />
      <MenuDivider />
      <MenuItem
        icon="log-out"
        text={t('logout')}
        intent={Intent.DANGER}
        onClick={onLogout}
      />
    </Menu>
  );

  return (
    <Navbar
      className={isDark ? "bp4-dark" : ""}
      style={{
        height: '75px',
        padding: '10px 20px',
        backgroundColor: isDark ? '#293742' : '#ffffff',
        transition: 'background-color 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        borderBottom: `1px solid ${isDark ? '#182026' : '#dbe3e8'}`
      }}
    >
      <Navbar.Group align={Alignment.LEFT} style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
          <img src={logoImg} alt="App Logo" style={{ height: '45px', width: 'auto', marginRight: '12px' }} />
          <Navbar.Heading style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>
            <strong style={{ color: isDark ? '#ffffff' : '#182026' }}>{t('appName')}</strong>
          </Navbar.Heading>
        </div>

        <Navbar.Divider />

        <div style={{ marginLeft: '10px', display: 'flex', gap: '8px' }}>
          <Button className="bp4-minimal" icon="home" text={t('home')} active={activeView === 'home'} onClick={() => setActiveView('home')} large />
          <Button className="bp4-minimal" icon="dashboard" text={t('dashboard')} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} large />

          {/* RBAC: 
              The Admin Tab is only rendered if the user session is verified as ADMIN.
          */}
          {isAdmin && (
            <Button
              className="bp4-minimal"
              icon="shield"
              text="Admin"
              active={activeView === 'admin'}
              onClick={() => setActiveView('admin')}
              intent={Intent.WARNING}
              large
            />
          )}
        </div>

        <div style={{ marginLeft: 'auto', marginRight: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.95em', color: isDark ? '#f5f8fa' : '#182026' }}>{displayIdentifier}</div>

            {/* Dynamic Status Tag */}
            <Tag
              minimal
              intent={isAdmin ? Intent.WARNING : Intent.PRIMARY}
              round
              icon={isAdmin ? "crown" : "user"}
              style={{ fontSize: '0.75em', padding: '0 8px' }}
            >
              {isAdmin ? 'ADMIN' : (userName ? userEmail : t('user'))}
            </Tag>
          </div>

          <div style={{ position: 'relative', display: 'inline-block', width: '38px', height: '38px' }}>
            <Popover
              content={userMenu}
              placement="bottom-end"
              minimal={true}
              usePortal={false}>
              <img
                src={userAvatar || `https://ui-avatars.com/api/?name=${displayIdentifier}&background=random`}
                alt="Profile"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: `2px solid ${isAdmin ? '#D9822B' : (isDark ? '#5c7080' : '#dbe3e8')}`,
                  objectFit: 'cover',
                  cursor: 'pointer',
                  display: 'block'
                }}
              />
            </Popover>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, marginRight: '10px', color: isDark ? '#a7b6c2' : '#5c7080', whiteSpace: 'nowrap' }}>{percentage}%</span>
          <ProgressBar intent={percentage === 100 ? "success" : "primary"} value={progress} style={{ width: '100px', height: '6px' }} stripes={percentage < 100} />
        </div>

        <Navbar.Divider />

        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px', gap: '10px' }}>
          <Button className="bp4-minimal" icon={isDark ? "flash" : "moon"} onClick={toggleDark} large />
          <Button className="bp4-minimal" icon="translate" text={i18n.language.toUpperCase()} onClick={toggleLanguage} large />
        </div>
      </Navbar.Group>
    </Navbar>
  );
};