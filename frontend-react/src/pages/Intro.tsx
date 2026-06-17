import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Intro.css';

const FEATURES = [
  {
    icon: '⚽',
    title: 'Biblioteca de Ejercicios',
    desc: 'Cientos de ejercicios clasificados por tipo, dificultad, edad y objetivos. Filtra, busca y descubre.',
    size: 'large',
    accent: '#5227FF',
  },
  {
    icon: '🎯',
    title: 'Pizarra Táctica',
    desc: 'Diseña jugadas con herramientas profesionales. Guarda plantillas y exporta como imagen.',
    size: 'normal',
    accent: '#2ecc71',
  },
  {
    icon: '📋',
    title: 'Sesiones de Entrenamiento',
    desc: 'Organiza ejercicios en sesiones completas con duración y notas.',
    size: 'normal',
    accent: '#e67e22',
  },
  {
    icon: '📄',
    title: 'Exportar a PDF',
    desc: 'Genera fichas profesionales con imagen, descripción y objetivos en un solo clic.',
    size: 'normal',
    accent: '#e74c3c',
  },
  {
    icon: '🚀',
    title: 'Mi Espacio',
    desc: 'Tus ejercicios privados organizados en carpetas. Comparte lo que quieras.',
    size: 'large',
    accent: '#FF9FFC',
  },
];

const STATS = [
  { value: '200+', label: 'Ejercicios' },
  { value: '5+', label: 'Herramientas' },
  { value: '100%', label: 'Gratis' },
  { value: '∞', label: 'Posibilidades' },
];

const Intro: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Intersection observer for scroll animations
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.anim-in').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="intro-root">
      {/* Sticky minimal nav */}
      <nav className={`intro-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="intro-nav-brand">
          <img src="/img/favicon-proyecto.png" alt="logo" className="intro-nav-logo" />
          <span>COACHFUTBOL</span>
        </div>
        <div className="intro-nav-links">
          <a href="#features">Características</a>
          <Link to="/ejercicios" className="intro-nav-cta">Entrar →</Link>
        </div>
      </nav>

      {/* ─── HERO ──────────────────────────────────────────────── */}
      <section className="intro-hero">
        {/* Animated aurora orbs */}
        <div className="aurora-wrap" aria-hidden>
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="orb orb-4" />
        </div>

        {/* Dot grid overlay */}
        <div className="dot-grid" aria-hidden />

        <div className="hero-content">
          {/* Badge */}
          <div className="hero-badge anim-in">
            <span className="badge-dot" />
            Plataforma profesional para entrenadores de fútbol
          </div>

          {/* Headline */}
          <h1 className="hero-headline anim-in">
            Entrena.<br />
            <span className="gradient-text">Planifica.</span><br />
            Evoluciona.
          </h1>

          <p className="hero-sub anim-in">
            Diseña ejercicios con pizarra táctica interactiva, organiza sesiones completas
            y exporta fichas profesionales en PDF. Todo en un solo lugar.
          </p>

          {/* CTAs */}
          <div className="hero-ctas anim-in">
            <button className="btn-primary" onClick={() => navigate('/ejercicios')}>
              <span>Explorar ejercicios</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="btn-ghost" onClick={() => navigate('/pizarra')}>
              Ver la pizarra →
            </button>
          </div>

          {/* Social proof */}
          <p className="hero-proof anim-in">
            Gratis · Sin registro requerido para explorar · Hecho por entrenadores, para entrenadores
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-hint" onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          <div className="scroll-mouse"><div className="scroll-dot" /></div>
          <span>Descubre más</span>
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────────── */}
      <section className="intro-stats anim-in" ref={statsRef}>
        {STATS.map(s => (
          <div key={s.label} className="stat-item">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────── */}
      <section className="intro-features" id="features" ref={featuresRef}>
        <div className="section-header anim-in">
          <div className="section-tag">Herramientas</div>
          <h2 className="section-title">Todo lo que necesitas<br /><span className="gradient-text">en una plataforma</span></h2>
          <p className="section-sub">Desde el diseño del ejercicio hasta la sesión completa, CoachFutbol te acompaña en cada paso.</p>
        </div>

        <div className="features-bento anim-in">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`feature-card fc-${i + 1}${f.size === 'large' ? ' fc-large' : ''}`} style={{ '--accent': f.accent } as React.CSSProperties}>
              <div className="fc-icon">{f.icon}</div>
              <h3 className="fc-title">{f.title}</h3>
              <p className="fc-desc">{f.desc}</p>
              <div className="fc-glow" />
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="intro-how">
        <div className="section-header anim-in">
          <div className="section-tag">Flujo de trabajo</div>
          <h2 className="section-title">Simple por diseño</h2>
        </div>
        <div className="how-steps anim-in">
          {[
            { n: '01', title: 'Crea tu ejercicio', desc: 'Usa la pizarra táctica para diseñar el esquema y rellena la ficha.' },
            { n: '02', title: 'Organiza en sesiones', desc: 'Agrupa ejercicios en sesiones con duración total y progresión.' },
            { n: '03', title: 'Comparte o exporta', desc: 'Genera PDFs profesionales o comparte el enlace directo.' },
          ].map(step => (
            <div key={step.n} className="how-step">
              <div className="step-num">{step.n}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA FINAL ─────────────────────────────────────────── */}
      <section className="intro-final-cta anim-in">
        <div className="final-cta-orb" />
        <div className="section-tag">Empieza hoy</div>
        <h2 className="final-cta-title">¿Listo para mejorar<br />tus entrenamientos?</h2>
        <p className="final-cta-sub">Únete gratuitamente y lleva tu metodología al siguiente nivel.</p>
        <div className="hero-ctas">
          <button className="btn-primary btn-lg" onClick={() => navigate('/register')}>
            Crear cuenta gratis
          </button>
          <button className="btn-ghost" onClick={() => navigate('/ejercicios')}>
            Explorar sin cuenta →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="intro-footer">
        <div className="intro-footer-brand">
          <img src="/img/favicon-proyecto.png" alt="logo" style={{ height: '24px' }} />
          <span>COACHFUTBOL</span>
        </div>
        <p className="intro-footer-copy">© 2025 CoachFutbol · Diseñado para entrenadores de fútbol</p>
      </footer>
    </div>
  );
};

export default Intro;
