import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

const Leaderboard = () => {
  const { t } = useLanguage();

  return (
    <div className="leaderboard-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="page-title">{t('leaderboard.title')}</h1>
      </motion.div>
      
      <div className="coming-soon">
        <h2>Em desenvolvimento</h2>
        <p>Ranking competitivo com filtros globais e por amigos.</p>
      </div>

      <style jsx>{`
        .leaderboard-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--space-6);
        }

        .page-title {
          font-size: var(--text-3xl);
          font-weight: 700;
          margin-bottom: var(--space-6);
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .coming-soon {
          text-align: center;
          padding: var(--space-16);
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;