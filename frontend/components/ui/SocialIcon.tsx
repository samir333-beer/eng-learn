import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type SocialProvider = 'google' | 'apple' | 'telegram';

interface SocialIconProps {
  provider: SocialProvider;
  size?: number;
  /** Used for single-color glyphs (black apple). Ignored for Google and Telegram. */
  color?: string;
}

/**
 * Official Google "G" logo — red / yellow / green / blue.
 * Source: Google Brand Resources — "Sign in with Google" button asset.
 */
const GOOGLE_G_PATHS = [
  { fill: '#EA4335', d: 'M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z' },
  { fill: '#4285F4', d: 'M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z' },
  { fill: '#FBBC05', d: 'M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z' },
  { fill: '#34A853', d: 'M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z' },
];

/** Apple logo glyph (viewBox 0 0 24 24). */
const APPLE_PATH =
  'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 ' +
  '3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.03 ' +
  '1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 ' +
  '3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-' +
  '.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 ' +
  '1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-' +
  '3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702';

/**
 * Official Telegram logo glyph — the white paper-plane from the official
 * Telegram logo (telegram.org brand asset, https://telegram.org/img/t_logo.svg).
 * The blue circle behind it is the button background (#0088CC), so the plane
 * paths are rendered on top of it exactly like the official mark.
 */
const TELEGRAM_PLANE_PATHS = [
  { fill: '#FFFFFF', d: 'M98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80' },
  { fill: '#EEEEEE', d: 'M98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035' },
  { fill: '#FFFFFF', d: 'M100.04 144.41l48.36 35.729c5.519 3.045 9.501 1.468 10.876-5.123l19.685-92.763c2.015-8.08-3.08-11.746-8.36-9.349l-115.5 44.55c-7.89 3.17-7.844 7.567-1.438 9.53l29.663 9.279 68.673-43.325c3.242-1.965 6.218-.91 3.776 1.258' },
];

export function SocialIcon({ provider, size = 24, color = '#000000' }: SocialIconProps) {
  switch (provider) {
    case 'google':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          {GOOGLE_G_PATHS.map((p) => (
            <Path key={p.fill} fill={p.fill} d={p.d} />
          ))}
        </Svg>
      );
    case 'apple':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path fill={color} d={APPLE_PATH} />
        </Svg>
      );
    case 'telegram':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 240 240">
          {TELEGRAM_PLANE_PATHS.map((p) => (
            <Path key={p.fill + '.' + p.d} fill={p.fill} d={p.d} />
          ))}
        </Svg>
      );
  }
}