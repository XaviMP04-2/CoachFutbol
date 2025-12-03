import React from 'react';
import { useNavigate } from 'react-router-dom';
import LiquidEther from '../components/LiquidEther';

const Intro: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Background Effect */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <LiquidEther
            colors={['#0f0c29', '#302b63', '#24243e']} // Deep premium colors
            mouseForce={25}
            cursorSize={120}
            isViscous={false}
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.6} // Slightly higher resolution for crispness
            isBounce={false}
            autoDemo={true}
            autoSpeed={0.4} // Slower, more elegant movement
            autoIntensity={1.8}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
        />
      </div>

      {/* Content Overlay */}
      <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: 10, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          pointerEvents: 'none',
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)' // Subtle vignette
      }}>
        <div style={{ 
            textAlign: 'center', 
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            padding: '2rem',
            // Minimalist glass effect, no heavy box
            backdropFilter: 'blur(2px)', 
        }}>
            {/* Logo - High Res */}
            <div style={{ 
                width: '180px', 
                height: '180px', 
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 0 40px rgba(82, 39, 255, 0.2)',
                marginBottom: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <img 
                    src="/img/favicon-proyecto-192.png" 
                    alt="CoachFutbol Logo" 
                    style={{ width: '120px', height: '120px', objectFit: 'contain', filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.3))' }} 
                />
            </div>

            {/* Title */}
            <h1 style={{ 
                fontSize: '5rem', 
                fontWeight: '800', 
                color: 'white', 
                margin: 0,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to bottom right, #ffffff, #a5a5a5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                COACHFUTBOL
            </h1>

            {/* Tagline */}
            <p style={{
                fontSize: '1.5rem',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: '300',
                letterSpacing: '0.05em',
                maxWidth: '600px',
                lineHeight: '1.5'
            }}>
                La herramienta definitiva para entrenadores profesionales.
            </p>

            {/* Button */}
            <button 
                onClick={() => navigate('/ejercicios')}
                style={{
                    marginTop: '2rem',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '1rem 4rem',
                    fontSize: '1.2rem',
                    color: 'white',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(5px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
                onMouseOver={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'white';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(82, 39, 255, 0.4)';
                }}
                onMouseOut={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
                }}
            >
                Entrar
            </button>
        </div>
        
        {/* Footer / Credits */}
        <div style={{
            position: 'absolute',
            bottom: '2rem',
            color: 'rgba(255, 255, 255, 0.3)',
            fontSize: '0.9rem',
            fontWeight: '300',
            letterSpacing: '0.1em'
        }}>
            DESIGNED FOR EXCELLENCE
        </div>
      </div>
    </div>
  );
};

export default Intro;
