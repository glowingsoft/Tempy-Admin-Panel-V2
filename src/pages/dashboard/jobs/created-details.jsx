import { Component } from 'react';
import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/config-global';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRoleModuleGuard } from 'src/auth/hooks';

import { CreatedJobDetailsView } from 'src/sections/care-home/jobs/view/created-job-details-view';
import { ModuleLoading } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

const metadata = { title: `Job Details | Dashboard - ${CONFIG.site.name}` };

class JobDetailsErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep visible in DevTools — blank screens hide the real crash.
    console.error('Job details crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      const message = this.state.error?.message || String(this.state.error);
      return (
        <Box sx={{ p: 3, maxWidth: 640 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Could not open job details
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {message}
          </Typography>
          <Button component={RouterLink} href={paths.dashboard.jobs.created} variant="contained">
            Back to created jobs
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default function CreatedJobDetailsPage() {
  const shouldRedirect = useRoleModuleGuard('jobs.created');
  if (shouldRedirect) {
    return (
      <ModuleLoading />
    );
  }

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <JobDetailsErrorBoundary>
        <CreatedJobDetailsView />
      </JobDetailsErrorBoundary>
    </>
  );
}
