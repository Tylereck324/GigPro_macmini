/**
 * Calendar component constants
 * Centralized configuration for calendar styling and behavior
 */

// Grid configuration
export const CALENDAR_COLUMNS = 7;
export const CALENDAR_MIN_ROWS = 5;
export const SKELETON_CELL_COUNT = 35;

// Cell dimensions - Balanced calendar cells
export const CELL_PADDING = {
  mobile: 'p-2',
  desktop: 'sm:p-3',
} as const;

// Border and rounded corners - Modern grid structure
export const CELL_BORDER_WIDTH = 'border border-border/30';
export const CELL_BORDER_RADIUS = 'rounded';

// Transitions and animations - Smooth interactions
export const CELL_TRANSITION = 'transition-all duration-200';
export const CELL_HOVER_TRANSFORM = 'hover:shadow-sm hover:border-border/60';

// Focus and interaction - Clear focus state
export const FOCUS_RING = 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1';
export const RING_OFFSET = 'ring-offset-1';

// Indicator sizes - Visible but not intrusive
export const PROFIT_INDICATOR_SIZE = 'w-1.5 h-1.5';

// Grid gap - Clear separation
export const GRID_GAP = 'gap-0';

// Weekday names
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// Opacity values
export const OPACITY_DIMMED = 'opacity-50';
export const OPACITY_BACKGROUND = 'bg-background/50';
export const OPACITY_SURFACE = 'bg-surface/50';
