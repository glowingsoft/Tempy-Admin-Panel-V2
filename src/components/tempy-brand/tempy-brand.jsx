import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

export const TEMPY_FONT = '"Righteous", cursive';

export const tempyBrandSx = {
  fontFamily: TEMPY_FONT,
  fontWeight: 400,
};

const TEMPY_BRAND_PATTERN = /(Tempy(?:'s)?|TEMPY)/g;

function isTempyBrandWord(part) {
  return part === 'Tempy' || part === "Tempy's" || part === 'TEMPY';
}

export function TempyBrand({ children = 'Tempy', component = 'span', sx, ...other }) {
  return (
    <Box component={component} sx={{ ...tempyBrandSx, ...sx }} {...other}>
      {children}
    </Box>
  );
}

export function renderWithTempyBrand(text) {
  if (typeof text !== 'string') {
    return text;
  }

  const parts = text.split(TEMPY_BRAND_PATTERN);

  return parts.map((part, index) =>
    isTempyBrandWord(part) ? <TempyBrand key={index}>{part}</TempyBrand> : part
  );
}
