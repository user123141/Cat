/**
 * Custom Window Sizing and Slicing Manager
 * Designed specifically for optimizing window coordinates, sizes, and responsive boundaries
 * under different screen factors (Mobile, Tablet, Desktop) to avoid complete overlap.
 */

export interface WindowPosition {
  width: string | number;
  height: string | number;
  top: string | number;
  bottom?: string | number;
  left: string | number;
  transform?: string;
}

// Default staggered offsets for desktop to prevent complete overlap
const DESKTOP_OFFSETS: Record<string, { x: number; y: number }> = {
  cats: { x: 0, y: 0 },
  shop: { x: 30, y: 25 },
  quests: { x: -30, y: 40 },
  analytics: { x: 45, y: -20 },
  settings: { x: -20, y: -30 },
  antistress: { x: 15, y: 35 },
};

/**
 * Calculates the responsive and optimized position for a given window frame.
 * @param windowId Unique identifier of the window
 * @param screenWidth Current viewport width
 * @param screenHeight Current viewport height
 */
export function getWindowLayout(
  windowId: string,
  screenWidth: number,
  screenHeight: number
): WindowPosition {
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;

  if (isMobile) {
    // Mobile/iOS style bottom sheet layout
    return {
      width: '100%',
      height: '84vh',
      top: 'auto',
      bottom: 0,
      left: 0,
    };
  }

  // Desktop or Tablet: Stagger windows using pre-defined offsets
  const offset = DESKTOP_OFFSETS[windowId] || { x: 0, y: 0 };
  
  if (isTablet) {
    // Sized elegantly for smaller screens
    const width = Math.min(680, screenWidth - 48);
    const height = Math.min(540, screenHeight - 160);
    const left = Math.max(0, (screenWidth - Number(width)) / 2 + offset.x * 0.5);
    const top = Math.max(50, (screenHeight - Number(height)) / 2 + offset.y * 0.5);
    return {
      width,
      height,
      top,
      left,
    };
  }

  // Standard Desktop Layout with staggering to ensure all background windows
  // show their headers and are easily clickable/focusable
  const width = Math.min(840, screenWidth - 120);
  const height = Math.min(580, screenHeight - 180);
  const left = Math.max(0, (screenWidth - Number(width)) / 2 + offset.x);
  const top = Math.max(50, (screenHeight - Number(height)) / 2 + offset.y);
  
  return {
    width,
    height,
    top,
    left,
  };
}

/**
 * Returns optimized window limits and padding styles.
 */
export function getScreenOptimizationClass(screenWidth: number): string {
  if (screenWidth < 640) return 'p-2 sm:p-3';
  if (screenWidth < 1024) return 'p-4 md:p-6';
  return 'p-8 lg:p-12';
}
