import { _mock } from './_mock';
import { formatDistanceKm, getDistanceKm } from './_agency-assign-staff';

// ----------------------------------------------------------------------

/** Urban shuttle pacing used for ETA / drive-time estimates. */
const MINUTES_PER_KM = 3.8;
const DWELL_MINUTES_PER_STOP = 8;
const DEPARTURE_MINUTES = 7 * 60; // 07:00 from agency hub

const COMPUTED_STOP_KEYS = [
  'sequence',
  'distanceKm',
  'distanceLabel',
  'travelMinutes',
  'travelLabel',
  'eta',
  'etaMinutes',
  'window',
  'fromLabel',
];

export const TRANSPORT_HUB = {
  id: 'agency-hub',
  name: 'CarePlus Agency Hub',
  address: '120 King Street, London, EC2V 8AU',
  latitude: 51.5154,
  longitude: -0.0922,
  type: 'hub',
};

export const TRANSPORT_VEHICLES = [
  {
    id: 'van-01',
    label: 'Van 01 · Mercedes Sprinter',
    capacity: 14,
    plate: 'CP 14 TEM',
    driver: 'James Carter',
    /** How many locations this vehicle covers on a run */
    maxStops: 12,
    zone: 'central',
  },
  {
    id: 'van-02',
    label: 'Van 02 · Ford Transit',
    capacity: 12,
    plate: 'CP 22 TEM',
    driver: 'Amina Yusuf',
    maxStops: 8,
    zone: 'south',
  },
  {
    id: 'minibus-01',
    label: 'Minibus 01 · VW Crafter',
    capacity: 16,
    plate: 'CP 31 TEM',
    driver: 'Daniel Hughes',
    maxStops: 20,
    zone: 'all',
  },
];

export const TRANSPORT_DATES = (() => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const make = (offsetDays, departureMinutes, activeCount, weekdayFallback) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offsetDays);
    const value = date.toISOString().slice(0, 10);
    const weekday = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const prefix =
      offsetDays === 0 ? 'Today' : offsetDays === 1 ? 'Tomorrow' : weekdayFallback || weekday;
    return {
      value,
      label: `${prefix} · ${weekday}`,
      departureMinutes,
      activeCount,
    };
  };

  return [
    make(0, 7 * 60, 20),
    make(1, 6 * 60 + 45, 14),
    make(2, 8 * 60, 10, 'Weekend / next'),
  ];
})();

function createStaff(seed, name, role) {
  return {
    id: `staff-${seed}`,
    name,
    role,
    avatarUrl: _mock.image.avatar(seed),
  };
}

export function formatClock(totalMinutes) {
  const normalized = ((Math.round(totalMinutes) % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function estimateDriveMinutes(distanceKm) {
  if (distanceKm == null || Number.isNaN(Number(distanceKm))) return 5;
  // Always show a real drive time — never 0 on a live stop leg
  return Math.max(4, Math.round(Number(distanceKm) * MINUTES_PER_KM));
}

export function toBaseStop(stop) {
  if (!stop) return stop;
  const next = { ...stop };
  COMPUTED_STOP_KEYS.forEach((key) => {
    delete next[key];
  });
  return next;
}

const STAFF_ROLES = ['Care Assistant', 'Support Worker', 'Senior Carer', 'Nurse', 'Care Assistant'];

const STAFF_FIRST_NAMES = [
  'Sarah',
  'Omar',
  'Emily',
  'Liam',
  'Priya',
  'Noah',
  'Chloe',
  'Marcus',
  'Hannah',
  'Ben',
  'Sofia',
  'Jack',
  'Amelia',
  'Ryan',
  'Isla',
  'Ethan',
  'Grace',
  'Lucas',
  'Mia',
  'Owen',
];

/** 20 client locations spread around London for a dense zigzag shuttle map. */
const TRANSPORT_STOP_SEEDS = [
  { id: 'riverside', name: 'Riverside Care Home', client: 'Riverside Care Group', address: '45 Thames Road, Greenwich, SE10 9RF', latitude: 51.4826, longitude: 0.0077, status: 'scheduled' },
  { id: 'oakwood', name: 'Oakwood Nursing Home', client: 'Oakwood Healthcare', address: '18 Forest Hill Road, Lewisham, SE23 3QT', latitude: 51.4395, longitude: -0.0534, status: 'scheduled' },
  { id: 'harbour', name: 'Harbour View Residence', client: 'Harbour View Ltd', address: '9 Canary Wharf Pier, London, E14 4QT', latitude: 51.5054, longitude: -0.0235, status: 'in_progress' },
  { id: 'meadow', name: 'Meadow Lane Home Care', client: 'Meadow Lane Services', address: '72 Meadow Lane, Hackney, E8 3AS', latitude: 51.545, longitude: -0.055, status: 'pending' },
  { id: 'parkside', name: 'Parkside Assisted Living', client: 'Parkside Group', address: '3 Victoria Park Road, Tower Hamlets, E3 5RB', latitude: 51.5308, longitude: -0.0401, status: 'scheduled' },
  { id: 'northgate', name: 'Northgate Care Centre', client: 'Northgate Partners', address: '22 Holloway Road, Islington, N7 8JL', latitude: 51.5532, longitude: -0.1177, status: 'scheduled' },
  { id: 'bridgewater', name: 'Bridgewater Lodge', client: 'Bridgewater Care', address: '14 Waterloo Bridge Road, SE1 8XR', latitude: 51.5045, longitude: -0.1132, status: 'scheduled' },
  { id: 'elmcourt', name: 'Elm Court Residence', client: 'Elm Court Ltd', address: '88 Brixton Hill, SW2 1AW', latitude: 51.4522, longitude: -0.118, status: 'scheduled' },
  { id: 'silverstream', name: 'Silverstream Home', client: 'Silverstream Care', address: '5 Stratford High Street, E15 2TF', latitude: 51.5416, longitude: -0.0034, status: 'pending' },
  { id: 'westbrook', name: 'Westbrook Care Hub', client: 'Westbrook Partners', address: '41 Shepherd’s Bush Road, W6 7LU', latitude: 51.4952, longitude: -0.2237, status: 'scheduled' },
  { id: 'lakeview', name: 'Lakeview Nursing Home', client: 'Lakeview Group', address: '27 Clapham Common South, SW4 9BX', latitude: 51.4578, longitude: -0.141, status: 'scheduled' },
  { id: 'crownfield', name: 'Crownfield Assisted Living', client: 'Crownfield Care', address: '12 Whitechapel Road, E1 1EW', latitude: 51.5194, longitude: -0.0612, status: 'in_progress' },
  { id: 'hillcrest', name: 'Hillcrest Care Home', client: 'Hillcrest Services', address: '63 Muswell Hill Road, N10 3HT', latitude: 51.5901, longitude: -0.1456, status: 'scheduled' },
  { id: 'riverbend', name: 'Riverbend Residence', client: 'Riverbend Ltd', address: '19 Putney Bridge Road, SW15 2PA', latitude: 51.4668, longitude: -0.2145, status: 'pending' },
  { id: 'sunningdale', name: 'Sunningdale Home Care', client: 'Sunningdale Care', address: '8 Peckham Rye, SE15 4JR', latitude: 51.4612, longitude: -0.0648, status: 'scheduled' },
  { id: 'mapleton', name: 'Mapleton Care Centre', client: 'Mapleton Partners', address: '55 Camden High Street, NW1 7JN', latitude: 51.539, longitude: -0.1426, status: 'scheduled' },
  { id: 'amberley', name: 'Amberley Lodge', client: 'Amberley Group', address: '31 Barking Road, E16 4HB', latitude: 51.5189, longitude: 0.0124, status: 'scheduled' },
  { id: 'fernleigh', name: 'Fernleigh Nursing Home', client: 'Fernleigh Care', address: '77 Croydon Road, SE20 7AA', latitude: 51.4128, longitude: -0.0569, status: 'pending' },
  { id: 'rosewood', name: 'Rosewood Assisted Living', client: 'Rosewood Services', address: '16 Finchley Road, NW3 5HT', latitude: 51.5478, longitude: -0.1802, status: 'scheduled' },
  { id: 'clearwater', name: 'Clearwater Care Home', client: 'Clearwater Ltd', address: '4 Deptford High Street, SE8 4AF', latitude: 51.478, longitude: -0.0264, status: 'scheduled' },
];

function buildStopStaff(seedStart, count = 5) {
  return Array.from({ length: count }, (_, index) => {
    const seed = seedStart + index;
    const firstName = STAFF_FIRST_NAMES[seed % STAFF_FIRST_NAMES.length];
    return createStaff(seed, `${firstName} Staff ${seed}`, STAFF_ROLES[index % STAFF_ROLES.length]);
  });
}

export const TRANSPORT_STOPS = TRANSPORT_STOP_SEEDS.map((seed, index) => ({
  id: `stop-${seed.id}`,
  name: seed.name,
  client: seed.client,
  address: seed.address,
  latitude: seed.latitude,
  longitude: seed.longitude,
  status: seed.status,
  staff: buildStopStaff(index * 5 + 1, 5),
}));

// ----------------------------------------------------------------------

export function getStopStaffCount(stop) {
  return stop?.staff?.length || 0;
}

export function getDepartureMinutes(dateValue) {
  const match = TRANSPORT_DATES.find((item) => item.value === dateValue);
  return match?.departureMinutes ?? DEPARTURE_MINUTES;
}

/**
 * Attach sequence + drive minutes / distance / clock ETA for each stop
 * based on Agency → nearest → next → farther flow.
 */
export function enrichStopsWithRouteTiming(
  hub = TRANSPORT_HUB,
  stops = [],
  departureMinutes = DEPARTURE_MINUTES
) {
  let previous = hub;
  let elapsed = 0;

  return stops.map((stop, index) => {
    const base = toBaseStop(stop);
    const distanceKm = getDistanceKm(previous, base);

    if (distanceKm == null) {
      console.warn('Staff shuttle: missing coordinates for stop', base?.id || base?.name);
    }

    const safeDistance = distanceKm ?? 1.2;
    const travelMinutes = estimateDriveMinutes(safeDistance);
    const arriveAt = departureMinutes + elapsed + travelMinutes;
    const windowStart = arriveAt - 10;
    const windowEnd = arriveAt + 20;
    const previousName = index === 0 ? hub.name : previous.name;

    const enriched = {
      ...base,
      sequence: index + 1,
      distanceKm: Number(safeDistance.toFixed(1)),
      distanceLabel: formatDistanceKm(safeDistance) || `${safeDistance.toFixed(1)} km`,
      travelMinutes,
      travelLabel: `${travelMinutes} min drive`,
      eta: formatClock(arriveAt),
      etaMinutes: travelMinutes,
      window: `${formatClock(windowStart)} – ${formatClock(windowEnd)}`,
      fromLabel: previousName,
    };

    elapsed += travelMinutes + DWELL_MINUTES_PER_STOP;
    previous = base;
    return enriched;
  });
}

export function computeRouteMetrics(
  hub = TRANSPORT_HUB,
  stops = [],
  departureMinutes = DEPARTURE_MINUTES
) {
  const timedStops = enrichStopsWithRouteTiming(hub, stops, departureMinutes);

  if (!timedStops.length) {
    return {
      totalStaff: 0,
      totalStops: 0,
      distanceKm: 0,
      distanceLabel: '0 km',
      durationMinutes: 0,
      durationLabel: '0 min',
    };
  }

  let distanceKm = timedStops.reduce((sum, stop) => sum + (stop.distanceKm || 0), 0);
  const returnLeg = getDistanceKm(timedStops[timedStops.length - 1], hub) ?? 0;
  distanceKm += returnLeg;

  const driveMinutes = timedStops.reduce((sum, stop) => sum + (stop.travelMinutes || 0), 0);
  const returnMinutes = estimateDriveMinutes(returnLeg);
  const durationMinutes = driveMinutes + returnMinutes + timedStops.length * DWELL_MINUTES_PER_STOP;
  const totalStaff = timedStops.reduce((sum, stop) => sum + getStopStaffCount(stop), 0);

  return {
    totalStaff,
    totalStops: timedStops.length,
    distanceKm: Number(distanceKm.toFixed(1)),
    distanceLabel: formatDistanceKm(distanceKm) || '0 km',
    durationMinutes,
    durationLabel:
      durationMinutes >= 60
        ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
        : `${durationMinutes} min`,
  };
}

/**
 * Nearest-neighbour from hub: visit closest remaining stop first,
 * then keep going to the next nearest (near → far path).
 */
export function optimizeStopOrder(
  hub = TRANSPORT_HUB,
  stops = [],
  departureMinutes = DEPARTURE_MINUTES
) {
  const remaining = stops.map((stop) => toBaseStop(stop));
  const ordered = [];
  let current = hub;

  while (remaining.length) {
    remaining.sort((a, b) => {
      const da = getDistanceKm(current, a) ?? Number.POSITIVE_INFINITY;
      const db = getDistanceKm(current, b) ?? Number.POSITIVE_INFINITY;
      return da - db;
    });

    const next = remaining.shift();
    ordered.push(next);
    current = next;
  }

  return enrichStopsWithRouteTiming(hub, ordered, departureMinutes);
}

export function withStopSequence(
  stops = [],
  hub = TRANSPORT_HUB,
  departureMinutes = DEPARTURE_MINUTES
) {
  return enrichStopsWithRouteTiming(hub, stops.map(toBaseStop), departureMinutes);
}

function pushZigZagSegment(points, from, to, bendIndex) {
  const dx = to.longitude - from.longitude;
  const dy = to.latitude - from.latitude;
  const length = Math.sqrt(dx * dx + dy * dy) || 0.01;
  // Perpendicular unit vector for zigzag bends
  const px = -dy / length;
  const py = dx / length;
  const side = bendIndex % 2 === 0 ? 1 : -1;
  const amplitude = Math.min(0.018, length * 0.45);

  points.push([
    from.longitude + dx * 0.33 + px * amplitude * side,
    from.latitude + dy * 0.33 + py * amplitude * side,
  ]);
  points.push([
    from.longitude + dx * 0.66 + px * amplitude * side * -0.85,
    from.latitude + dy * 0.66 + py * amplitude * side * -0.85,
  ]);
  points.push([to.longitude, to.latitude]);
}

/** Curved / zigzag LineString so the shuttle path looks like a real multi-stop run. */
export function buildRouteLineCoordinates(hub = TRANSPORT_HUB, stops = []) {
  const points = [[hub.longitude, hub.latitude]];
  let previous = hub;

  stops.forEach((stop, index) => {
    pushZigZagSegment(points, previous, stop, index);
    previous = stop;
  });

  // Return leg also zigzags back to the hub
  pushZigZagSegment(points, previous, hub, stops.length);

  return points;
}

function filterStopsForVehicle(stops, vehicleId) {
  const vehicle = TRANSPORT_VEHICLES.find((item) => item.id === vehicleId) || TRANSPORT_VEHICLES[0];

  if (vehicle.zone === 'south') {
    return stops.filter((stop) => stop.latitude < 51.51);
  }

  if (vehicle.zone === 'central') {
    return stops.filter((stop) => stop.latitude >= 51.47 && stop.latitude <= 51.56);
  }

  return stops;
}

function applyDateStatuses(stops, dateValue) {
  const dateIndex = Math.max(
    0,
    TRANSPORT_DATES.findIndex((item) => item.value === dateValue)
  );

  return stops.map((stop, index) => {
    if (dateIndex === 1) {
      return {
        ...stop,
        status: index % 4 === 0 ? 'pending' : index % 5 === 0 ? 'in_progress' : 'scheduled',
      };
    }

    if (dateIndex >= 2) {
      return {
        ...stop,
        status: index % 3 === 0 ? 'completed' : 'scheduled',
      };
    }

    return {
      ...stop,
      status: index === 2 ? 'in_progress' : index === 5 ? 'pending' : 'scheduled',
    };
  });
}

/**
 * Full functional plan builder — date + vehicle change the stop list,
 * timings, statuses, and route length.
 */
export function buildShuttlePlan({
  date = TRANSPORT_DATES[0].value,
  vehicleId = TRANSPORT_VEHICLES[0].id,
  routeMode = 'optimized',
} = {}) {
  const dateConfig = TRANSPORT_DATES.find((item) => item.value === date) || TRANSPORT_DATES[0];
  const vehicle = TRANSPORT_VEHICLES.find((item) => item.id === vehicleId) || TRANSPORT_VEHICLES[0];
  const departureMinutes = dateConfig.departureMinutes ?? DEPARTURE_MINUTES;

  const activePool = TRANSPORT_STOPS.slice(0, dateConfig.activeCount || TRANSPORT_STOPS.length);
  const datedStops = applyDateStatuses(activePool, date);
  const vehicleStops = filterStopsForVehicle(datedStops, vehicleId).slice(0, vehicle.maxStops);

  const ordered =
    routeMode === 'optimized'
      ? optimizeStopOrder(TRANSPORT_HUB, vehicleStops, departureMinutes)
      : withStopSequence(vehicleStops, TRANSPORT_HUB, departureMinutes);

  return {
    hub: TRANSPORT_HUB,
    date,
    vehicleId,
    vehicle,
    departureMinutes,
    departureTime: formatClock(departureMinutes),
    routeMode,
    stops: ordered,
    metrics: computeRouteMetrics(TRANSPORT_HUB, ordered, departureMinutes),
  };
}

export function createInitialTransportPlan() {
  return buildShuttlePlan({
    date: TRANSPORT_DATES[0].value,
    vehicleId: TRANSPORT_VEHICLES[0].id,
    routeMode: 'optimized',
  });
}

export const TRANSPORT_STATUS_COLOR = {
  scheduled: 'info',
  in_progress: 'warning',
  pending: 'default',
  completed: 'success',
};

export function formatTransportStatus(status) {
  if (status === 'in_progress') return 'In progress';
  if (!status) return 'Scheduled';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * How many of the selected vehicle type to dispatch for this staff load.
 * Agencies can send multiple vans when one vehicle is not enough.
 */
export function getFleetRequirement(totalStaff = 0, vehicle = TRANSPORT_VEHICLES[0]) {
  const capacity = Math.max(1, vehicle?.capacity || 1);
  const staff = Math.max(0, Number(totalStaff) || 0);
  const vehiclesNeeded = staff === 0 ? 0 : Math.ceil(staff / capacity);
  const totalSeats = vehiclesNeeded * capacity;
  const spareSeats = Math.max(0, totalSeats - staff);

  return {
    capacity,
    staff,
    vehiclesNeeded,
    totalSeats,
    spareSeats,
    multiVehicle: vehiclesNeeded > 1,
  };
}
