import React from 'react';
import { useApp } from '../ctx';
import Logo from './Logo';
import { Icon } from './Icons';

export default function Footer() {
  const { t } = useApp();
  return (
    <footer className="footer">
      <div className="footer-in">
        <div className="footer-brand">
          <Logo size={32} />
          <p>{t('Resume, ID cards, certificates, marksheets, passport photos and more — free to start.')}</p>
          <p className="muted">Everything runs in your browser. Your documents stay private.</p>
        </div>
        <div className="footer-col">
          <h4>{t('Home')}</h4>
          <a href="#/">{t('Home')}</a>
          <a href="#/projects">{t('Projects')}</a>
          <a href="#/pricing">{t('Pricing')}</a>
          <a href="#/login">{t('Login')}</a>
        </div>
        <div className="footer-col">
          <h4>{t('School')}</h4>
          <a href="#/tool/marksheet">{t('Marksheet / Report Card')}</a>
          <a href="#/tool/certificate">{t('Certificate Generator')}</a>
          <a href="#/students">{t('Student Data Table')}</a>
          <a href="#/bulk">{t('Bulk Generate')}</a>
        </div>
        <div className="footer-col">
          <h4>{t('Photos & AI')}</h4>
          <a href="#/photo">{t('Photo Studio')}</a>
          <a href="#/imagegen">{t('AI Image Generator')}</a>
          <a href="#/tool/resume">{t('Resume / CV Builder')}</a>
          <a href="#/tool/portfolio">{t('Portfolio Builder')}</a>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} BuilderHub · <Icon name="code" className="sm" /> {t('Build documents, cards & photos in minutes')}
      </div>
    </footer>
  );
}
