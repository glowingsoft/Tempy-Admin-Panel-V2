import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

export function AnimatedRainIcon({ size = 18, color = '#757575' }) {
  const cloudSize = size;
  const dropW = Math.max(1.5, size * 0.1);
  const dropH = Math.max(3, size * 0.22);

  return (
    <Box
      sx={{
        position: 'relative',
        width: cloudSize,
        height: cloudSize,
        flexShrink: 0,
        '@keyframes shiftRainFall': {
          '0%': { transform: 'translateY(0)', opacity: 0 },
          '20%': { opacity: 0.85 },
          '100%': { transform: `translateY(${size * 0.42}px)`, opacity: 0 },
        },
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 24 24"
        sx={{
          width: cloudSize,
          height: cloudSize,
          display: 'block',
          color,
        }}
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 18a4 4 0 1 1 .8-7.9A5.5 5.5 0 0 1 18.5 9.5 4.5 4.5 0 0 1 17 18H7z"
        />
      </Box>

      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            left: cloudSize * (0.28 + index * 0.18),
            top: cloudSize * 0.58,
            width: dropW,
            height: dropH,
            borderRadius: 1,
            bgcolor: color,
            opacity: 0,
            animation: 'shiftRainFall 1.1s infinite ease-in',
            animationDelay: `${index * 0.22}s`,
          }}
        />
      ))}
    </Box>
  );
}
