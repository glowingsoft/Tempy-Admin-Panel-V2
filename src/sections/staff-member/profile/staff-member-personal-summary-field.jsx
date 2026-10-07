import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import {
  PERSONAL_SUMMARY_WORD_LIMIT,
  clampToWordLimit,
  countWords,
} from './staff-member-profile-store';

// ----------------------------------------------------------------------

export function StaffMemberPersonalSummaryField({
  value,
  onChange,
  label = 'Personal summary',
}) {
  const wordCount = countWords(value);
  const overLimit = wordCount > PERSONAL_SUMMARY_WORD_LIMIT;

  return (
    <Stack spacing={0.75} sx={{ gridColumn: { sm: '1 / -1' } }}>
      <TextField
        fullWidth
        multiline
        minRows={4}
        label={label}
        value={value || ''}
        onChange={(event) => onChange(clampToWordLimit(event.target.value))}
        placeholder="A short introduction — who you are, your experience, and how you like to work."
      />
      <Typography
        variant="caption"
        sx={{ color: overLimit ? 'error.main' : 'text.secondary', textAlign: 'right' }}
      >
        {Math.min(wordCount, PERSONAL_SUMMARY_WORD_LIMIT)} / {PERSONAL_SUMMARY_WORD_LIMIT} words
      </Typography>
    </Stack>
  );
}
