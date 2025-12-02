export const lightTheme = {
  primary: '#3B82F6',        // Modern blue
  primaryLight: '#60A5FA',   // Lighter blue
  primaryDark: '#2563EB',    // Darker blue
  secondary: '#8B5CF6',      // Purple
  secondaryLight: '#A78BFA', // Lighter purple
  success: '#10B981',        // Emerald green
  successLight: '#34D399',   // Lighter emerald
  danger: '#EF4444',         // Red
  dangerLight: '#F87171',    // Lighter red
  warning: '#F59E0B',        // Amber
  warningLight: '#FBBF24',   // Lighter amber
  background: '#F8FAFC',     // Slate 50
  surface: '#FFFFFF',        // White
  surfaceHover: '#F1F5F9',   // Slate 100
  text: '#0F172A',           // Slate 900
  textSecondary: '#64748B',  // Slate 500
  border: '#E2E8F0',         // Slate 200
  amazonFlex: '#FF9900',     // Amazon orange
  doorDash: '#FF3008',       // DoorDash red
  walmartSpark: '#0071CE',   // Walmart blue
} as const;

export type ThemeColors = typeof lightTheme;
