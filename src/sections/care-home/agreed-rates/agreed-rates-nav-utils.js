import { paths } from 'src/routes/paths';

/** Dashboard mode → agreed rates page path (care homes and individuals only). */
export function getAgreedRatesPath(mode = 'careHome') {
  return mode === 'user' ? paths.dashboard.individualHomeCare.jobs.agreedRates : paths.dashboard.jobs.agreedRates;
}

export function getJobBidsPath(mode = 'careHome') {
  switch (mode) {
    case 'hospital':
      return paths.dashboard.hospital.jobs.bids;
    case 'localAuthority':
      return paths.dashboard.localAuthority.jobs.bids;
    case 'user':
      return paths.dashboard.individualHomeCare.jobs.bids;
    default:
      return paths.dashboard.jobs.bids;
  }
}
