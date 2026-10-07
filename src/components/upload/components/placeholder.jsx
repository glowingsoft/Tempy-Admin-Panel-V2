import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { UploadIllustration } from 'src/assets/illustrations';

// ----------------------------------------------------------------------

export function UploadPlaceholder({ ...other }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        py: 0.5,
      }}
      {...other}
    >
      <UploadIllustration hideBackground sx={{ width: 120, mb: 0.5 }} />

      <Stack spacing={0.5} sx={{ textAlign: 'center' }}>
        <Box sx={{ typography: 'subtitle2' }}>Drop or select file</Box>
        <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
          Drop files here or click to
          <Box
            component="span"
            sx={{ mx: 0.5, color: 'primary.main', textDecoration: 'underline' }}
          >
            browse
          </Box>
          through your machine.
        </Box>
      </Stack>
    </Box>
  );
}
