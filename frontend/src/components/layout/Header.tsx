import React from 'react';
import { Navbar, Icon, ProgressBar, Button } from "@blueprintjs/core";
import { useTranslation } from 'react-i18next'; // Import i18n hook

/**
 * Header Component
 * Enhanced with larger text and icons for better visibility
 * Updated with i18n support and language toggle. User/Cog icons removed.
 */
interface HeaderProps {
  progress: number;
}

export const Header: React.FC<HeaderProps> = ({ progress }) => {
  const { t, i18n } = useTranslation(); // Initialize translation
  const percentage = Math.round(progress * 100);

  // Helper function to toggle between English and Spanish
  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  return (
    <Navbar className="bp4-dark" style={{ height: '60px', padding: '10px 20px' }}>
      <Navbar.Group align="left">
        <Navbar.Heading style={{ fontSize: '20px' }}>
          <Icon icon="layers" intent="primary" size={25} style={{ marginRight: '12px' }} />
          {/* Dynamic App Name */}
          <strong>{t('appName')}</strong>
        </Navbar.Heading>
        <Navbar.Divider />
        {/* Dynamic Nav Buttons */}
        <Button className="bp4-minimal" icon="home" text={t('home')} large />
        <Button className="bp4-minimal" icon="dashboard" text={t('dashboard')} active large />
      </Navbar.Group>

      <Navbar.Group align="right">
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '25px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, marginRight: '12px', color: '#a7b6c2' }}>
            {/* Dynamic Progress Text */}
            {t('progress')}: {percentage}%
          </span>
          <ProgressBar 
            intent={percentage === 100 ? "success" : "primary"} 
            value={progress} 
            style={{ width: '150px', height: '10px' }} 
            stripes={percentage < 100}
          />
        </div>
        <Navbar.Divider />
        {/* Language Toggle Button */}
        <Button 
          className="bp4-minimal" 
          icon="translate" 
          text={i18n.language.startsWith('es') ? 'EN' : 'ES'} 
          onClick={toggleLanguage}
          large 
        />
      </Navbar.Group>
    </Navbar>
  );
};