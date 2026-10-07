import { m } from 'framer-motion';
import PropTypes from 'prop-types';
// @mui
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import { alpha, useTheme } from '@mui/material/styles';
// theme
// import { bgGradient } from "src/theme/css";
// components
import { MotionContainer, varFade } from 'src/components/animate';
import { CONFIG } from 'src/config-global';
import { bgGradient } from 'src/theme/styles';

export function FaqsHero({ data }) {
  const theme = useTheme();

  return (
    <Box sx={{ px: { xs: 2, md: 6 }, pb: 3, pt: 3, display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          ...bgGradient({
            color: alpha(theme.palette.grey[900], 0.8),
            imgUrl: `${CONFIG.site.basePath}/assets/images/faqs/hero.jpg`,
          }),
          height: { md: 300 },
          py: { xs: 10, md: 0 },
          borderRadius: '.7rem .7rem .7rem .7rem',
          overflow: 'hidden',
          position: 'relative',
          backgroundPosition: 'end',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <Container component={MotionContainer}>
          <Box
            sx={{
              bottom: { md: 30 },
              position: { md: 'absolute' },
              textAlign: { xs: 'center', md: 'unset' },
            }}
          >
            <div>
              <br />

              <Stack spacing={2} display="inline-flex" direction="row" sx={{ color: 'common.white' }}>
                <TextAnimate text={data} />
              </Stack>
            </div>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

function TextAnimate({ text, variants, sx, ...other }) {
  return (
    <Box
      component={m.div}
      sx={{
        typography: 'h1',
        overflow: 'hidden',
        display: 'inline-flex',
        ...sx,
      }}
      {...other}
    >
      {text?.split('').map((letter, index) => (
        <m.span key={index} variants={variants || varFade().inUp}>
          {letter}
        </m.span>
      ))}
    </Box>
  );
}

TextAnimate.propTypes = {
  sx: PropTypes.object,
  text: PropTypes.string,
  variants: PropTypes.object,
};

// import { m } from 'framer-motion';

// import Box from '@mui/material/Box';
// import Container from '@mui/material/Container';
// import TextField from '@mui/material/TextField';
// import { useTheme } from '@mui/material/styles';
// import InputAdornment from '@mui/material/InputAdornment';
// import { outlinedInputClasses } from '@mui/material/OutlinedInput';

// import { CONFIG } from 'src/config-global';
// import { varAlpha, bgGradient } from 'src/theme/styles';

// import { Iconify } from 'src/components/iconify';
// import { varFade, AnimateText, MotionContainer, animateTextClasses } from 'src/components/animate';

// // ----------------------------------------------------------------------

// export function FaqsHero() {
//   const theme = useTheme();

//   return (
//     <Box
//       sx={{
//         ...bgGradient({
//           color: `0deg, ${varAlpha(theme.vars.palette.grey['900Channel'], 0.8)}, ${varAlpha(theme.vars.palette.grey['900Channel'], 0.8)}`,
//           imgUrl: `${CONFIG.site.basePath}/assets/images/faqs/hero.webp`,
//         }),
//         height: { md: 560 },
//         py: { xs: 10, md: 0 },
//         overflow: 'hidden',
//         position: 'relative',
//       }}
//     >
//       <Container component={MotionContainer}>
//         <Box
//           sx={{
//             bottom: { md: 80 },
//             position: { md: 'absolute' },
//             textAlign: { xs: 'center', md: 'unset' },
//           }}
//         >
//           <AnimateText
//             component="h1"
//             variant="h1"
//             text={['Where', 'can we help you?']}
//             variants={varFade({ distance: 24 }).inRight}
//             sx={{
//               color: 'common.white',
//               [`& .${animateTextClasses.line}[data-index="0"]`]: {
//                 [`& .${animateTextClasses.word}[data-index="0"]`]: { color: 'primary.main' },
//               },
//             }}
//           />

//           <m.div variants={varFade().in}>
//             <TextField
//               fullWidth
//               placeholder="Search support..."
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
//                   </InputAdornment>
//                 ),
//               }}
//               sx={{
//                 mt: 5,
//                 maxWidth: 360,
//                 [`& .${outlinedInputClasses.root}`]: { bgcolor: 'common.white' },
//                 [`& .${outlinedInputClasses.input}`]: { typography: 'subtitle1' },
//               }}
//             />
//           </m.div>
//         </Box>
//       </Container>
//     </Box>
//   );
// }
