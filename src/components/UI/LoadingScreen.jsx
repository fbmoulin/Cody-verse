import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Loader2 } from 'lucide-react';

const LoadingScreen = () => {
  const logoVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <div className="loading-screen">
      <div className="loading-content">
        {/* Logo with Pulse Effect */}
        <motion.div
          className="logo-container"
          variants={logoVariants}
          initial="initial"
          animate="animate"
        >
          <motion.div
            className="logo-pulse"
            variants={pulseVariants}
            animate="animate"
          />
          <div className="logo">
            <Zap className="logo-icon" size={48} />
            <h1 className="logo-text">CodyVerse</h1>
          </div>
        </motion.div>

        {/* Loading Spinner */}
        <motion.div
          className="spinner-container"
          variants={spinnerVariants}
          animate="animate"
        >
          <Loader2 className="spinner" size={32} />
        </motion.div>

        {/* Loading Text */}
        <motion.div
          className="loading-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p>Inicializando sua jornada de aprendizado...</p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          className="progress-container"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, var(--background) 0%, var(--surface-light) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .loading-content {
          text-align: center;
          max-width: 400px;
          padding: var(--space-8);
        }

        .logo-container {
          position: relative;
          margin-bottom: var(--space-8);
        }

        .logo-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(79, 70, 229, 0.2) 0%, transparent 70%);
          z-index: -1;
        }

        .logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
        }

        .logo-icon {
          color: var(--primary);
          filter: drop-shadow(0 0 20px rgba(79, 70, 229, 0.5));
        }

        .logo-text {
          font-family: 'Poppins', sans-serif;
          font-size: var(--text-3xl);
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }

        .spinner-container {
          margin-bottom: var(--space-6);
        }

        .spinner {
          color: var(--primary);
        }

        .loading-text {
          margin-bottom: var(--space-8);
        }

        .loading-text p {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          margin: 0;
        }

        .progress-container {
          width: 100%;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: var(--surface-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: var(--radius-lg);
          position: relative;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: progressShine 1.5s infinite;
        }

        @keyframes progressShine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;