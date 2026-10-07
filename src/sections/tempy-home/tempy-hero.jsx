import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import Grid from '@mui/material/Unstable_Grid2';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { STAFF_SPECIALTY_API_OPTIONS } from 'src/_mock/_staff';

import { buildPublicStaffLocation } from 'src/store/Reducer/public-staff-api';

import { StandaloneAddressInput, geocodeAddress } from './standalone-address-input';
import { TempyStaffSearchModal } from './tempy-staff-search-modal';
import {
  TEMPY_ACCENT_LIGHT,
  TEMPY_GRADIENT_BUTTON,
  TEMPY_GRADIENT_BUTTON_HOVER,
  TEMPY_GRADIENT_HERO,
} from './tempy-theme';

const TRUST_BADGES = [
  { icon: 'solar:shield-check-bold', label: 'DBS Verified Staff' },
  { icon: 'solar:star-bold', label: 'Rated 4.8 / 5' },
  { icon: 'solar:clock-circle-bold', label: 'Avg. Response 4 min' },
  { icon: 'solar:buildings-bold', label: '1,200+ Agencies' },
];

const OTHER_STAFF_TYPE = 'other';

const LANDING_STAFF_TYPE_OPTIONS = [
  ...STAFF_SPECIALTY_API_OPTIONS,
  { value: OTHER_STAFF_TYPE, label: 'Other role (specify)' },
];

function resolveSearchSpeciality(staffType, customRole = '') {
  if (staffType === OTHER_STAFF_TYPE) {
    return String(customRole || '').trim();
  }
  return staffType;
}

export function TempyHero() {
  const theme = useTheme();
  const [specialty, setSpecialty] = useState(STAFF_SPECIALTY_API_OPTIONS[0].value);
  const [customRole, setCustomRole] = useState('');
  const [searchSpeciality, setSearchSpeciality] = useState('');
  const [address, setAddress] = useState('');
  const [place, setPlace] = useState(null);
  const [searchLocation, setSearchLocation] = useState(null);
  const [listOpen, setListOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  const hasPlaceCoords = (value) => {
    const lat = Number(value?.latitude);
    const lng = Number(value?.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
  };

  const openStaffList = async () => {
    const resolvedSpeciality = resolveSearchSpeciality(specialty, customRole);

    if (!resolvedSpeciality) {
      toast.error(specialty === OTHER_STAFF_TYPE ? 'Describe the role you need' : 'Select a staff type');
      return;
    }
    if (!String(address || '').trim()) {
      toast.error('Add a location');
      return;
    }

    setSearching(true);
    try {
      let nextPlace = place;
      if (!hasPlaceCoords(nextPlace)) {
        nextPlace = await geocodeAddress(address);
        if (nextPlace) setPlace(nextPlace);
      }

      const location = buildPublicStaffLocation(nextPlace, address);
      if (!location.fullAddress) {
        toast.error('Add a location');
        return;
      }

      setSearchLocation(location);
      setSearchSpeciality(resolvedSpeciality);
      setListOpen(true);
    } finally {
      setSearching(false);
    }
  };

  const handleSpecialtyChange = (value) => {
    setSpecialty(value);
    if (value !== OTHER_STAFF_TYPE) {
      setCustomRole('');
    }
  };

  const handlePlaceSelect = (nextPlace) => {
    setPlace(nextPlace || null);
  };

  return (
    <Box
      sx={{
        pt: { xs: 12, md: 16 },
        pb: 0,
        background: TEMPY_GRADIENT_HERO,
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          background: theme.palette.background.default,
          clipPath: 'ellipse(55% 100% at 50% 100%)',
        },
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 4, md: 6 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={{ xs: 5, md: 6 }}
          sx={{ pb: { xs: 6, md: 8 } }}
        >
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.5,
                mb: 2.5,
                borderRadius: 10,
                bgcolor: alpha('#fff', 0.12),
                border: '1px solid',
                borderColor: alpha('#fff', 0.2),
              }}
            >
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: TEMPY_ACCENT_LIGHT, flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.9), fontWeight: 600 }}>
                Live bids available now
              </Typography>
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                lineHeight: 1.1,
                mb: 2,
                fontSize: { xs: 34, md: 52, lg: 58 },
                color: 'common.white',
              }}
            >
              Post a job to get bids
              <Box component="span" sx={{ color: TEMPY_ACCENT_LIGHT, display: 'block' }}>
                for your healthcare needs.
              </Box>
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'common.white',
                mb: 4,
                fontSize: { xs: 16, md: 17 },
                fontWeight: 500,
                lineHeight: 1.75,
                maxWidth: 480,
                textShadow: '0 1px 2px rgba(0,0,0,0.25)',
              }}
            >
              Get matched with experienced health care professionals for your healthcare needs. Receive competitive offers, streamline hiring, and save up to 30% on staffing costs.
            </Typography>

            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2.5,
                p: { xs: 2.5, md: 3 },
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                maxWidth: 520,
              }}
            >
              <Grid container spacing={1.5} alignItems="stretch" sx={{ mb: 1.5 }}>
                <Grid xs={12} sm={specialty === OTHER_STAFF_TYPE ? 12 : 6} sx={{ display: 'flex' }}>
                  <FormControl
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': { height: 40 },
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        py: 0,
                      },
                    }}
                  >
                    <InputLabel>Staff type</InputLabel>
                    <Select
                      value={specialty}
                      onChange={(event) => handleSpecialtyChange(event.target.value)}
                      label="Staff type"
                      startAdornment={
                        <InputAdornment position="start">
                          <Iconify icon="solar:user-id-bold" sx={{ color: 'text.disabled', width: 18, height: 18 }} />
                        </InputAdornment>
                      }
                    >
                      {LANDING_STAFF_TYPE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {specialty === OTHER_STAFF_TYPE ? (
                  <Grid xs={12} sx={{ display: 'flex' }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Describe role"
                      placeholder="e.g. Night supervisor, physiotherapist"
                      value={customRole}
                      onChange={(event) => setCustomRole(event.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { height: 40 } }}
                    />
                  </Grid>
                ) : null}

                <Grid xs={12} sm={specialty === OTHER_STAFF_TYPE ? 12 : 6} sx={{ display: 'flex' }}>
                  <StandaloneAddressInput
                    value={address}
                    onChange={setAddress}
                    onPlaceSelect={handlePlaceSelect}
                    label="Location"
                    size="small"
                    labelPlacement="outlined"
                    sx={{
                      width: 1,
                      '& .MuiOutlinedInput-root': { height: 40 },
                    }}
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={openStaffList}
                disabled={searching}
                sx={{
                  borderRadius: 1.5,
                  fontWeight: 700,
                  fontSize: 15,
                  py: 1.5,
                  color: '#fff',
                  background: TEMPY_GRADIENT_BUTTON,
                  '&:hover': { background: TEMPY_GRADIENT_BUTTON_HOVER },
                }}
              >
                {searching ? 'Searching…' : 'See available staff →'}
              </Button>
            </Box>
          </Box>

          {/* Right: Image */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {/* Floating review badge */}


            <Box
              component="img"
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80"
              alt="Healthcare professional with patient"
              sx={{
                width: '100%',
                maxWidth: 520,
                height: { xs: 280, md: 420 },
                objectFit: 'cover',
                borderRadius: 3,
                boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
                border: '3px solid',
                borderColor: alpha('#fff', 0.15),
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </Box>
        </Stack>

        {/* Trust badges strip */}
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1.5}
          justifyContent={{ xs: 'flex-start', md: 'center' }}
          sx={{ pb: { xs: 4, md: 6 }, pt: { xs: 2, md: 0 } }}
        >
          {TRUST_BADGES.map((badge) => (
            <Stack
              key={badge.label}
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: 10,
                bgcolor: alpha('#fff', 0.1),
                border: '1px solid',
                borderColor: alpha('#fff', 0.18),
              }}
            >
              <Iconify icon={badge.icon} sx={{ width: 15, height: 15, color: TEMPY_ACCENT_LIGHT }} />
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.85), fontWeight: 600, fontSize: 12 }}>
                {badge.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Container>

      <TempyStaffSearchModal
        open={listOpen}
        onClose={() => setListOpen(false)}
        speciality={searchSpeciality}
        location={searchLocation}
      />
    </Box>
  );
}
