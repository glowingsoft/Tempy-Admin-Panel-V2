import TableCell from '@mui/material/TableCell';
import Tooltip from '@mui/material/Tooltip';
import { useEffect, useRef, useState } from 'react';

const EllipsisCellWithTooltip = ({
  children,
  maxWidth = '150px',
  ...props
}) => {
  const textRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const checkOverflow = () => {
    const el = textRef.current;
    if (!el) return;
    // Only show tooltip if actual text width > visible width
    setShowTooltip(el.scrollWidth > el.clientWidth);
  };

  useEffect(() => {
    checkOverflow();

    // Recheck on window resize (table layout might change)
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children]); // rerun when content changes

  // Small delay to ensure layout has settled (important in tables)
  useEffect(() => {
    const timeout = setTimeout(checkOverflow, 50);
    return () => clearTimeout(timeout);
  }, [children]);

  const content = (
    <span
      ref={textRef}
      style={{
        display: 'inline-block',
        width: '100%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {children}
    </span>
  );

  return (
    <TableCell
      sx={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth,
        cursor: showTooltip ? 'pointer' : 'default',
      }}
      {...props}
    >
      {showTooltip ? (
        <Tooltip title={children} arrow>
          {content}
        </Tooltip>
      ) : (
        content
      )}
    </TableCell>
  );
};

export default EllipsisCellWithTooltip;
