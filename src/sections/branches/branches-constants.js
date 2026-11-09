
export const BRANCH_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  INACTIVE: 'inactive',
  DELETED: 'deleted',
  DELETE: 'deleted',
};

export const BRANCH_STATUS_OPTIONS = [
  { value: BRANCH_STATUS.ACTIVE, label: 'Active' },
  { value: BRANCH_STATUS.PENDING, label: 'Pending' },
  { value: BRANCH_STATUS.INACTIVE, label: 'Inactive' },
  { value: BRANCH_STATUS.DELETED, label: 'Deleted' },
];

export const BRANCH_STATUS_TABS = [
  { value: 'all', label: 'All', color: 'info' },
  { value: BRANCH_STATUS.ACTIVE, label: 'Active', color: 'success' },
  { value: BRANCH_STATUS.PENDING, label: 'Pending', color: 'warning' },
  { value: BRANCH_STATUS.INACTIVE, label: 'Inactive', color: 'error' },
  { value: BRANCH_STATUS.DELETED, label: 'Deleted', color: 'default' },
];

export const CQC_RATING_OPTIONS = [
  { value: 'outstanding', label: 'Outstanding' },
  { value: 'good', label: 'Good' },
  { value: 'requires_improvement', label: 'Requires improvement' },
  { value: 'inadequate', label: 'Inadequate' },
  { value: 'not_rated', label: 'Not rated yet' },
];

export const UK_COUNTY_OPTIONS = [
  'Bedfordshire',
  'Berkshire',
  'Bristol',
  'Buckinghamshire',
  'Cambridgeshire',
  'Cheshire',
  'City of London',
  'Cornwall',
  'Cumbria',
  'Derbyshire',
  'Devon',
  'Dorset',
  'County Durham',
  'East Riding of Yorkshire',
  'East Sussex',
  'Essex',
  'Gloucestershire',
  'Greater London',
  'Greater Manchester',
  'Hampshire',
  'Herefordshire',
  'Hertfordshire',
  'Isle of Wight',
  'Kent',
  'Lancashire',
  'Leicestershire',
  'Lincolnshire',
  'Merseyside',
  'Norfolk',
  'North Yorkshire',
  'Northamptonshire',
  'Northumberland',
  'Nottinghamshire',
  'Oxfordshire',
  'Rutland',
  'Shropshire',
  'Somerset',
  'South Yorkshire',
  'Staffordshire',
  'Suffolk',
  'Surrey',
  'Tyne and Wear',
  'Warwickshire',
  'West Midlands',
  'West Sussex',
  'West Yorkshire',
  'Wiltshire',
  'Worcestershire',
  'Blaenau Gwent',
  'Bridgend',
  'Caerphilly',
  'Cardiff',
  'Carmarthenshire',
  'Ceredigion',
  'Conwy',
  'Denbighshire',
  'Flintshire',
  'Gwynedd',
  'Isle of Anglesey',
  'Merthyr Tydfil',
  'Monmouthshire',
  'Neath Port Talbot',
  'Newport',
  'Pembrokeshire',
  'Powys',
  'Rhondda Cynon Taf',
  'Swansea',
  'Torfaen',
  'Vale of Glamorgan',
  'Wrexham',
  'Aberdeen City',
  'Aberdeenshire',
  'Angus',
  'Argyll and Bute',
  'City of Edinburgh',
  'Clackmannanshire',
  'Dumfries and Galloway',
  'Dundee City',
  'East Ayrshire',
  'East Dunbartonshire',
  'East Lothian',
  'East Renfrewshire',
  'Falkirk',
  'Fife',
  'Glasgow City',
  'Highland',
  'Inverclyde',
  'Midlothian',
  'Moray',
  'Na h-Eileanan Siar',
  'North Ayrshire',
  'North Lanarkshire',
  'Orkney Islands',
  'Perth and Kinross',
  'Renfrewshire',
  'Scottish Borders',
  'Shetland Islands',
  'South Ayrshire',
  'South Lanarkshire',
  'Stirling',
  'West Dunbartonshire',
  'West Lothian',
  'Antrim',
  'Armagh',
  'Down',
  'Fermanagh',
  'Londonderry',
  'Tyrone',
];

export function matchUkCounty(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const lower = raw.toLowerCase();
  const exact = UK_COUNTY_OPTIONS.find((county) => county.toLowerCase() === lower);
  if (exact) return exact;

  const withoutCounty = lower.replace(/^county\s+/i, '').trim();
  const exactWithout = UK_COUNTY_OPTIONS.find(
    (county) =>
      county.toLowerCase() === withoutCounty ||
      county.toLowerCase().replace(/^county\s+/i, '') === withoutCounty
  );
  if (exactWithout) return exactWithout;

  return (
    UK_COUNTY_OPTIONS.find(
      (county) =>
        lower.includes(county.toLowerCase()) || county.toLowerCase().includes(lower)
    ) || ''
  );
}
