import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

import { readFileAsDataUrl } from './messages-utils';

// ----------------------------------------------------------------------

export function NewGroupChatDialog({ open, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setAvatarUrl('');
      setPreviewUrl('');
    }
  }, [open]);

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarUrl(dataUrl);
      setPreviewUrl(dataUrl);
    } catch {
      // ignore read errors
    }

    event.target.value = '';
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onSubmit?.({ name: trimmedName, avatarUrl });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 3,
          px: 3,
          py: 4,
        },
      }}
    >
      <Typography variant="h6" align="center" fontWeight={700} sx={{ mb: 3 }}>
        New Group Chat
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Box
          component="label"
          htmlFor="group-chat-avatar-input"
          sx={{
            cursor: 'pointer',
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: '2px dashed',
            borderColor: 'divider',
            p: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <input
            id="group-chat-avatar-input"
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />

          <Box
            sx={{
              width: 1,
              height: 1,
              borderRadius: '50%',
              overflow: 'hidden',
              bgcolor: previewUrl ? 'transparent' : 'primary.lighter',
            }}
          >
            {previewUrl ? (
              <Avatar src={previewUrl} sx={{ width: 1, height: 1 }} />
            ) : (
              <Box
                sx={{
                  width: 1,
                  height: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                }}
              >
                <Iconify icon="solar:camera-add-bold" width={28} sx={{ color: 'text.secondary' }} />
                <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1.2 }}>
                  Upload File
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <TextField
        fullWidth
        placeholder="Group name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleSubmit();
          }
        }}
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton
          onClick={handleSubmit}
          disabled={!name.trim()}
          color="primary"
          sx={{
            width: 48,
            height: 48,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
          }}
        >
          <Iconify icon="eva:arrow-forward-fill" width={22} />
        </IconButton>
      </Box>
    </Dialog>
  );
}
