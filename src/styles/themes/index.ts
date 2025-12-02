import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';
import type { Theme } from '@/types/common';

export { lightTheme, darkTheme };

export function getThemeColors(theme: Theme) {
  return theme === 'light' ? lightTheme : darkTheme;
}
