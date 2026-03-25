import React from 'react';
import { Navbar, ProgressBar, Button, Alignment, Tag, Intent, Tooltip } from "@blueprintjs/core";
import { useTranslation } from 'react-i18next';
// NEW: Import the custom logo from assets for Vite processing
import logoImg from '../../assets/logo.png';

// Define the available view modes
type ViewMode = 'home' | 'dashboard';

/**
 * Header Component
 * Phase 4 Update: Displays User Identity (Avatar & Name) and App Progress.
 * Manages view switching between Home and Dashboard.
 */
interface HeaderProps {
  progress: number;
  isDark: boolean;
  toggleDark: () => void;
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  userEmail: string;
  userName: string | null;   // Added Phase 4
  userAvatar: string | null; // Added Phase 4
}

export const Header: React.FC<HeaderProps> = ({ 
  progress, 
  isDark, 
  toggleDark, 
  activeView, 
  setActiveView, 
  userEmail,
  userName,
  userAvatar
}) => {
  const { t, i18n } = useTranslation();
  const percentage = Math.round(progress * 100);

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  // Determine what name to show (Real Name or Email as fallback)
  const displayIdentifier = userName || userEmail;

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
        {/* BRANDING SECTION */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
          <img 
            src={logoImg} 
            alt="App Logo" 
            style={{ height: '45px', width: 'auto', marginRight: '12px' }} 
          />
          <Navbar.Heading style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>
            <strong style={{ color: isDark ? '#ffffff' : '#182026' }}>{t('appName')}</strong>
          </Navbar.Heading>
        </div>
        
        <Navbar.Divider />
        
        {/* VIEW SWITCHER SECTION */}
        <div style={{ marginLeft: '10px', display: 'flex', gap: '8px' }}>
          <Button 
            className="bp4-minimal" 
            icon="home" 
            text={t('home')} 
            active={activeView === 'home'} 
            onClick={() => setActiveView('home')} 
            large 
          />
          <Button 
            className="bp4-minimal" 
            icon="dashboard" 
            text={t('dashboard')} 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')} 
            large 
          />
        </div>

        {/* PHASE 4: USER IDENTITY - Profile Info & Avatar */}
        <div style={{ marginLeft: 'auto', marginRight: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.95em', color: isDark ? '#f5f8fa' : '#182026' }}>
              {displayIdentifier}
            </div>
            <Tag minimal intent={Intent.PRIMARY} round style={{ fontSize: '0.75em', padding: '0 8px' }}>
              {userName ? userEmail : t('user')}
            </Tag>
          </div>

          <Tooltip content={displayIdentifier}>
            <img 
              src={userAvatar || `https://ui-avatars.com/api/?name=${displayIdentifier}&background=random`} 
              alt="Profile" 
              style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '50%', 
                border: `2px solid ${isDark ? '#5c7080' : '#dbe3e8'}`,
                objectFit: 'cover'
              }} 
            />
          </Tooltip>
        </div>

        {/* PROGRESS SECTION */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, marginRight: '10px', color: isDark ? '#a7b6c2' : '#5c7080', whiteSpace: 'nowrap' }}>
            {percentage}%
          </span>
          <ProgressBar 
            intent={percentage === 100 ? "success" : "primary"} 
            value={progress} 
            style={{ width: '100px', height: '6px' }} 
            stripes={percentage < 100} 
          />
        </div>

        <Navbar.Divider />
        
        {/* SETTINGS SECTION */}
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
          <Button 
            className="bp4-minimal" 
            icon={isDark ? "flash" : "moon"} 
            onClick={toggleDark}             
            large 
          />
          <Button 
            className="bp4-minimal" 
            icon="translate" 
            text={i18n.language.toUpperCase()} 
            onClick={toggleLanguage} 
            large 
          />
        </div>
      </Navbar.Group>
    </Navbar>
  );
};