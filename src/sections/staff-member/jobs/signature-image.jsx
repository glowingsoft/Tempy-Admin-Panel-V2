import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

/*
 * Signatures are always shown as black ink on white. Three kinds are stored:
 *   - black ink on white (current pad)            → shown as is
 *   - coloured ink on a transparent PNG            → grayscale + contrast makes the ink black
 *   - navy (#1a237e) ink on black: older check-in signatures were re-encoded as JPEG, which has
 *     no transparency, so the background turned black. `R - B` is ~0 for both black and white but
 *     strongly negative for navy, so 1 + 3·(R − B) maps the background to white and the ink to
 *     black (the SVG filter below).
 */
const DARK_BACKGROUND_FILTER_ID = 'signature-on-dark-background';
const LIGHT_FILTER = 'grayscale(1) contrast(2)';
const DARK_FILTER = `url(#${DARK_BACKGROUND_FILTER_ID})`;

const cache = new Map();

/** Corner pixel of the image: opaque and dark → the signature sits on a black background. */
function detectDarkBackground(src) {
  if (cache.has(src)) return Promise.resolve(cache.get(src));

  return new Promise((resolve) => {
    const image = new Image();
    // Only this probe asks for CORS — the <img> on screen does not, so it still loads if the
    // bucket sends no CORS headers (the probe then fails and the light filter is used).
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      let dark = false;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, 1, 1, 0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        dark = a > 200 && r + g + b < 120;
      } catch {
        dark = false;
      }
      cache.set(src, dark);
      resolve(dark);
    };
    image.onerror = () => {
      cache.set(src, false);
      resolve(false);
    };
    image.src = src;
  });
}

export function useSignatureFilter(src) {
  const [filter, setFilter] = useState(() =>
    cache.get(src) ? DARK_FILTER : LIGHT_FILTER
  );

  useEffect(() => {
    if (!src) return undefined;
    let active = true;
    detectDarkBackground(src).then((dark) => {
      if (active) setFilter(dark ? DARK_FILTER : LIGHT_FILTER);
    });
    return () => {
      active = false;
    };
  }, [src]);

  return filter;
}

/** The SVG filter the dark-background signatures reference. Rendered next to each image. */
function DarkBackgroundFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id={DARK_BACKGROUND_FILTER_ID} colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="3 0 -3 0 1  3 0 -3 0 1  3 0 -3 0 1  0 0 0 1 0"
        />
      </filter>
    </svg>
  );
}

/**
 * Lightbox `render.slide` for slides flagged `isSignature`: the signature on a white card, black
 * ink, instead of on the lightbox's dark backdrop. Other slides keep the default rendering.
 */
export function renderSignatureSlide({ slide, rect }) {
  if (!slide?.isSignature) return undefined;
  return (
    <SignatureImage
      src={slide.src}
      alt={slide.title || 'Signature'}
      sx={{
        p: 2,
        borderRadius: 1,
        maxWidth: Math.max(0, (rect?.width || 0) - 32),
        maxHeight: Math.max(0, (rect?.height || 0) - 32),
        width: 'auto',
        height: 'auto',
      }}
    />
  );
}

/** A stored signature, always black ink on white. */
export function SignatureImage({ src, alt = 'Signature', sx, ...other }) {
  const filter = useSignatureFilter(src);

  return (
    <>
      <DarkBackgroundFilter />
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{ bgcolor: '#fff', objectFit: 'contain', ...sx, filter }}
        {...other}
      />
    </>
  );
}
