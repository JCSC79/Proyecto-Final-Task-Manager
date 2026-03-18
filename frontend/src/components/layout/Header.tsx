import React from 'react';
import { Navbar, ProgressBar, Button, Alignment } from "@blueprintjs/core";
import { useTranslation } from 'react-i18next';
// NEW: Import the custom logo from assets for Vite processing
import logoImg from '../../assets/logo.png';

// Define the available view modes
type ViewMode = 'home' | 'dashboard';

/**
 * Header Component
 * Updated: Manages view switching between Home and Dashboard.
 * Added: Custom branding logo and improved navigation spacing.
 */
interface HeaderProps {
  progress: number;
  isDark: boolean;
  toggleDark: () => void;
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ progress, isDark, toggleDark, activeView, setActiveView }) => {
  const { t, i18n } = useTranslation();
  const percentage = Math.round(progress * 100);

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  return (
    <Navbar 
      className={isDark ? "bp4-dark" : ""} // Ensures internal elements adapt
      style={{ 
        height: '70px', 
        padding: '10px 20px',
        backgroundColor: isDark ? '#293742' : '#ffffff',
        transition: 'background-color 0.3s ease',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Navbar.Group align={Alignment.LEFT} style={{ width: '100%' }}>
        {/* BRANDING SECTION */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
          <img 
            src={logoImg} 
            alt="App Logo" 
            style={{ height: '80px', width: 'auto', marginRight: '12px' }} 
          />
          <Navbar.Heading style={{ fontSize: '20px', display: 'flex', alignItems: 'center' }}>
            <strong style={{ color: isDark ? '#ffffff' : '#182026' }}>{t('appName')}</strong>
          </Navbar.Heading>
        </div>
        
        <Navbar.Divider />
        
        {/* VIEW SWITCHER SECTION: Added margin-right auto to push progress group to the right */}
        <div style={{ marginLeft: '10px', display: 'flex', gap: '12px', marginRight: 'auto' }}>
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

        {/* PROGRESS SECTION: Now correctly positioned thanks to the previous margin-right: auto */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '25px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, marginRight: '12px', color: isDark ? '#a7b6c2' : '#5c7080', whiteSpace: 'nowrap' }}>
            {t('progress')}: {percentage}%
          </span>
          <ProgressBar 
            intent={percentage === 100 ? "success" : "primary"} 
            value={progress} 
            style={{ width: '120px', height: '8px' }} 
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
            style={{ margin: '0 5px' }}
          />
          <Button 
            className="bp4-minimal" 
            icon="translate" 
            text={i18n.language.startsWith('es') ? 'EN' : 'ES'} 
            onClick={toggleLanguage} 
            large 
          />
        </div>
      </Navbar.Group>
    </Navbar>
  );
};