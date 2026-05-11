import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import styles from './pages.module.css';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className={styles.wrapper}>
      <Header
        progress={0}
        showProgress={false}
        activeView="admin"
        setActiveView={(view) => {
          if (view === 'home') { 
            navigate('/'); 
          }
          if (view === 'dashboard') { 
            navigate('/dashboard'); 
          }
        }}
      />
      <main className={styles.main}>
        {/* sr-only h1: every page needs a first-level heading for screen readers */}
        <h1 className="sr-only">{t('adminPanel')}</h1>
        <AdminDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
