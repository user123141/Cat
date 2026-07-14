export interface WindowPosition {
  width: string | number;
  height: string | number;
  top: string | number;
  bottom?: string | number;
  left: string | number;
  transform?: string;
}

const DESKTOP_OFFSETS: Record<string, { x: number; y: number }> = {
  cats: { x: 0, y: 0 },
  shop: { x: 30, y: 25 },
  quests: { x: -30, y: 40 },
  analytics: { x: 45, y: -20 },
  settings: { x: -20, y: -30 },
  antistress: { x: 15, y: 35 },
};

export function getWindowLayout(
  windowId: string,
  screenWidth: number,
  screenHeight: number
): WindowPosition {
  const isMobile = screenWidth < 768;

  if (isMobile) {
    // На телефонах окно занимает ВСЁ доступное пространство под меню, перекрывая док для удобства
    const topOffset = 36;  // высота меню
    return {
      width: '100%',
      height: screenHeight - topOffset,
      top: topOffset,
      bottom: 0,
      left: 0,
    };
  }

  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const offset = DESKTOP_OFFSETS[windowId] || { x: 0, y: 0 };

  if (isTablet) {
    const width = Math.min(680, screenWidth - 48);
    const height = Math.min(540, screenHeight - 160);
    const left = Math.max(0, (screenWidth - Number(width)) / 2 + offset.x * 0.5);
    const top = Math.max(50, (screenHeight - Number(height)) / 2 + offset.y * 0.5);
    return { width, height, top, left };
  }

  const width = Math.min(840, screenWidth - 120);
  const height = Math.min(580, screenHeight - 180);
  const left = Math.max(0, (screenWidth - Number(width)) / 2 + offset.x);
  const top = Math.max(50, (screenHeight - Number(height)) / 2 + offset.y);

  return { width, height, top, left };
}