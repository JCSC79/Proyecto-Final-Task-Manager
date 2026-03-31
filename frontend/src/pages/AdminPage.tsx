import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import styles from './pages.module.css';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      <Header
        progress={0}
        activeView="home"
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
        <AdminDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
