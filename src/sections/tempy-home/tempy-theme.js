export const TEMPY_GRADIENT_START = '#705AEB';
export const TEMPY_GRADIENT_END = '#0A7587';

/** @deprecated Use TEMPY_GRADIENT_START */
export const TEMPY_PURPLE_START = TEMPY_GRADIENT_START;

/** @deprecated Use TEMPY_GRADIENT_END */
export const TEMPY_PURPLE_END = TEMPY_GRADIENT_END;

export const TEMPY_GRADIENT = `linear-gradient(135deg, ${TEMPY_GRADIENT_START} 0%, ${TEMPY_GRADIENT_END} 100%)`;

export const TEMPY_GRADIENT_HERO = `linear-gradient(160deg, ${TEMPY_GRADIENT_START} 0%, ${TEMPY_GRADIENT_END} 55%, #086570 100%)`;

export const TEMPY_GRADIENT_BUTTON = `linear-gradient(90deg, ${TEMPY_GRADIENT_START}, ${TEMPY_GRADIENT_END})`;

export const TEMPY_GRADIENT_BUTTON_HOVER = `linear-gradient(90deg, ${TEMPY_GRADIENT_END}, ${TEMPY_GRADIENT_START})`;

export const TEMPY_ACCENT_LIGHT = '#8FDCE8';

export const TEMPY_SOFT_BG = '#EAF6F8';

export const TEMPY_GRADIENT_SX = {
  background: TEMPY_GRADIENT,
  color: '#fff',
  '&:hover': {
    background: TEMPY_GRADIENT_BUTTON_HOVER,
  },
};
