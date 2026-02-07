import React from 'react';
import { C, METEO_CONFIG, type MeteoLevel } from '../constants';

interface WeatherIconProps {
  level: MeteoLevel;
  size?: number;
}

/**
 * SVG météo — vraies icônes nuage/soleil/pluie
 * - rouge: nuage + pluie
 * - orange: nuage + soleil partiel
 * - vert: soleil avec petit nuage
 * - bleu: grand soleil radieux
 */
export function WeatherIcon({ level, size = 24 }: WeatherIconProps) {
  const color = METEO_CONFIG[level].color;

  // Rouge: nuage + pluie
  if (level === 'rouge') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M6.5 18C4 18 2 16.2 2 14c0-1.85 1.4-3.4 3.2-3.85C5.6 7.4 8 5.5 11 5.5c2.2 0 4.1 1.1 5.2 2.7A5 5 0 0120 13a5 5 0 01-5 5H6.5z" fill={color} opacity="0.25" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="8" y1="20" x2="7" y2="23" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="20" x2="11" y2="23" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="16" y1="20" x2="15" y2="23" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }

  // Orange: nuage + soleil partiel
  if (level === 'orange') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3.5" fill="#F59E0B" opacity="0.35"/>
        <line x1="9" y1="2.5" x2="9" y2="3.5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="4.5" x2="5" y2="5.5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="3.5" y1="8" x2="4.5" y2="8" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7.5 17C5.5 17 4 15.5 4 13.8c0-1.4 1-2.6 2.4-2.9C6.7 8.7 8.5 7 11 7c1.7 0 3.1.8 4 2.1A3.8 3.8 0 0118.5 13a3.8 3.8 0 01-3.8 4H7.5z" fill={color} opacity="0.3" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    );
  }

  // Vert: soleil avec petit nuage
  if (level === 'vert') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="10" r="4" fill={color} opacity="0.25" stroke={color} strokeWidth="1.5"/>
        <line x1="12" y1="3" x2="12" y2="4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="15.5" x2="12" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5" y1="10" x2="6.5" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="17.5" y1="10" x2="19" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="7" y1="5" x2="8" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="16" y1="14" x2="17" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="17" y1="5" x2="16" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8" y1="14" x2="7" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 20c-1.2 0-2.2-.9-2.2-2 0-.9.6-1.6 1.5-1.8.2-1.3 1.3-2.2 2.7-2.2 1 0 1.9.5 2.4 1.3a2.3 2.3 0 012.1 2.3 2.3 2.3 0 01-2.3 2.4H9z" fill={C.gray300} opacity="0.5" stroke={C.gray400} strokeWidth="1"/>
      </svg>
    );
  }

  // Bleu: grand soleil radieux
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" fill={color} opacity="0.2" stroke={color} strokeWidth="1.5"/>
      <line x1="12" y1="3" x2="12" y2="5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3" y1="12" x2="5" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="19" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="5.6" y1="5.6" x2="7.1" y2="7.1" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16.9" y1="16.9" x2="18.4" y2="18.4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18.4" y1="5.6" x2="16.9" y2="7.1" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7.1" y1="16.9" x2="5.6" y2="18.4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
