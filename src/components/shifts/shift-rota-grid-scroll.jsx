import { useCallback, useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

const SCROLL_AREA_SX = {
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  overflowX: 'scroll',
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: '#9e9e9e #f0f0f0',
  scrollbarGutter: 'stable',
  '&::-webkit-scrollbar': {
    height: 12,
    width: 10,
  },
  '&::-webkit-scrollbar-thumb': {
    borderRadius: 999,
    backgroundColor: '#9e9e9e',
    border: '2px solid #f0f0f0',
    '&:hover': {
      backgroundColor: '#757575',
    },
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: '#f0f0f0',
  },
};

function getScrollHints(element) {
  if (!element) {
    return { left: false, right: false, canScrollX: false };
  }

  const { scrollLeft, scrollWidth, clientWidth } = element;
  const canScrollX = scrollWidth > clientWidth + 2;

  return {
    canScrollX,
    left: canScrollX && scrollLeft > 4,
    right: canScrollX && scrollLeft + clientWidth < scrollWidth - 4,
  };
}

export function useDragScroll(ref) {
  const [isPanning, setIsPanning] = useState(false);
  const panSession = useRef({ x: 0, scrollLeft: 0, moved: false });

  const handleMouseDown = useCallback(
    (event) => {
      if (event.button !== 0) return;

      if (
        event.target.closest(
          'button, a, input, select, textarea, [role="button"], [data-date-header], [data-shift-cell], .MuiIconButton-root, .MuiButtonBase-root, .MuiSelect-select'
        )
      ) {
        return;
      }

      const el = ref.current;
      if (!el) return;

      panSession.current = {
        x: event.pageX,
        scrollLeft: el.scrollLeft,
        moved: false,
      };
      setIsPanning(true);
    },
    [ref]
  );

  useEffect(() => {
    if (!isPanning) return undefined;

    const handleMouseMove = (event) => {
      const el = ref.current;
      if (!el) return;

      const deltaX = event.pageX - panSession.current.x;

      if (Math.abs(deltaX) > 6) {
        panSession.current.moved = true;
      }

      el.scrollLeft = panSession.current.scrollLeft - deltaX;
    };

    const handleMouseUp = () => {
      if (panSession.current.moved) {
        const blockClick = (clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopImmediatePropagation();
          document.removeEventListener('click', blockClick, true);
        };
        document.addEventListener('click', blockClick, true);
      }

      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, ref]);

  return { isPanning, handleMouseDown };
}

export function ShiftRotaGridScroll({
  gridRef,
  gridContentWidth,
  gridLine,
  isPanning,
  onGridMouseDown,
  stickyLeftWidth = 0,
  children,
}) {
  const [scrollHints, setScrollHints] = useState({ left: false, right: false, canScrollX: false });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === gridRef.current);
    };

    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, [gridRef]);

  const exitFullscreen = (event) => {
    event.stopPropagation();
    document.exitFullscreen?.();
  };

  const updateScrollHints = useCallback(() => {
    setScrollHints(getScrollHints(gridRef.current));
  }, [gridRef]);

  useEffect(() => {
    updateScrollHints();

    const el = gridRef.current;
    if (!el) return undefined;

    el.addEventListener('scroll', updateScrollHints, { passive: true });
    window.addEventListener('resize', updateScrollHints);

    const resizeObserver = new ResizeObserver(updateScrollHints);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollHints);
      window.removeEventListener('resize', updateScrollHints);
      resizeObserver.disconnect();
    };
  }, [gridContentWidth, gridRef, updateScrollHints]);

  const fadeBottom = scrollHints.canScrollX ? 12 : 0;

  const showLeftFade = scrollHints.left && !(Number(stickyLeftWidth) > 0);

  return (
    <Box
      sx={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        containerType: 'inline-size',
      }}
    >
      {showLeftFade && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: fadeBottom,
            width: 28,
            zIndex: 4,
            pointerEvents: 'none',
            background: (theme) =>
              `linear-gradient(to right, ${theme.vars.palette.background.paper} 0%, transparent 100%)`,
          }}
        />
      )}

      {scrollHints.right && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: fadeBottom,
            width: 40,
            zIndex: 4,
            pointerEvents: 'none',
            background: (theme) =>
              `linear-gradient(to left, ${theme.vars.palette.background.paper} 0%, transparent 100%)`,
          }}
        />
      )}

      <Box
        ref={gridRef}
        onMouseDown={onGridMouseDown}
        onScroll={updateScrollHints}
        sx={{
          ...SCROLL_AREA_SX,
          bgcolor: '#fff',
          cursor: isPanning ? 'grabbing' : 'grab',
          userSelect: isPanning ? 'none' : 'auto',
        }}
      >
        {isFullscreen ? (
          <IconButton
            aria-label="Exit fullscreen"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={exitFullscreen}
            sx={{
              position: 'fixed',
              top: 16,
              right: 16,
              zIndex: 20,
              bgcolor: 'background.paper',
              boxShadow: 3,
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <Iconify icon="mingcute:close-line" width={20} />
          </IconButton>
        ) : null}
        <Box
          sx={{
            width: gridContentWidth,
            minWidth: gridContentWidth,
            flexShrink: 0,
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${gridLine}`,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
