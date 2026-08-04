import { Palette } from '@/constants/design';

export function useThemePalette() {
  // The app is locked to light mode for a clean, minimal look.
  return Palette.light;
}