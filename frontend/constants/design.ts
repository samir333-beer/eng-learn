export const Palette = {
  light: {
    bg: '#FFFFFF',
    card: '#F2F3F5',
    primary: '#5B5FEF',
    primaryDark: '#4347D8',
    accent: '#22C55E',
    text: '#1A1A1A',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    danger: '#EF4444',
    gradient: ['#5B5FEF', '#8B5CF6', '#EC4899'] as const,
  },
  dark: {
    bg: '#FFFFFF',
    card: '#F2F3F5',
    primary: '#5B5FEF',
    primaryDark: '#4347D8',
    accent: '#22C55E',
    text: '#1A1A1A',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    danger: '#EF4444',
    gradient: ['#5B5FEF', '#8B5CF6', '#EC4899'] as const,
  },
};

export const LevelColors: Record<string, string> = {
  A1: '#22C55E',
  A2: '#3B82F6',
  B1: '#F59E0B',
  B2: '#EF4444',
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };