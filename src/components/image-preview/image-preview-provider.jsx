import { useMemo, useState, useEffect, useCallback } from 'react';

import { Lightbox } from '../lightbox';
import { imageClasses } from '../image/classes';

// ----------------------------------------------------------------------

// Clicking an image inside any of these keeps the element's own behavior (navigation, menus,
// file pickers, editors, maps, lightboxes...). Add `data-no-preview` to opt an element out.
const EXCLUDED_ANCESTORS = [
  '[data-no-preview]',
  'a[href]',
  'button',
  'label',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="tab"]',
  '[contenteditable="true"]',
  '.yarl__root',
  '.leaflet-container',
  '.mapboxgl-map',
].join(', ');

const MIN_SIZE = 24;

function isSvg(src) {
  return /^data:image\/svg/i.test(src) || /\.svg(\?|#|$)/i.test(src);
}

function getPreviewableImage(target) {
  if (!(target instanceof Element)) return null;

  // The `Image` component can render an overlay on top of its <img>.
  const img = target.closest('img') || target.closest(`.${imageClasses.root}`)?.querySelector(`img:not(.${imageClasses.overlay})`);

  if (!img || img.closest(EXCLUDED_ANCESTORS)) return null;

  const src = img.currentSrc || img.src;

  if (!src || isSvg(src)) return null;

  const { width, height } = img.getBoundingClientRect();

  if (width < MIN_SIZE && height < MIN_SIZE) return null;

  return img;
}

// ----------------------------------------------------------------------

export function ImagePreviewProvider({ children }) {
  const [slide, setSlide] = useState(null);

  const handleClick = useCallback((event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;

    const img = getPreviewableImage(event.target);

    if (!img) return;

    // Preview takes precedence over clickable parents (e.g. table rows).
    event.preventDefault();
    event.stopPropagation();

    setSlide({ src: img.currentSrc || img.src, alt: img.alt || undefined });
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [handleClick]);

  const slides = useMemo(() => (slide ? [slide] : []), [slide]);

  return (
    <>
      {children}

      <Lightbox
        open={!!slide}
        close={() => setSlide(null)}
        slides={slides}
        disableTotal
        disableVideo
        disableCaptions
        disableSlideshow
        disableThumbnails
        carousel={{ finite: true }}
        styles={{ navigationPrev: { display: 'none' }, navigationNext: { display: 'none' } }}
      />
    </>
  );
}
