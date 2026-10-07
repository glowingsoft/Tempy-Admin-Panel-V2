import { describe, expect, it } from 'vitest';

import { mapBookingLogs, mapBookingUpdateResponse } from './nurse-checkin-api-utils';

const CHECK_OUT_RESPONSE = {
  message: 'Booking updated successfully',
  data: {
    _id: '6ab275bd2c9f042752e6bd8a',
    status: 'completed',
    attendance: {
      checkIn: '2026-09-22T12:38:39.740Z',
      checkOut: '2026-09-22T12:49:58.511Z',
      proofPicture: 'https://tempys3-bucket.s3.eu-west-2.amazonaws.com/checkin-proof.jpg',
      signature: 'https://tempys3-bucket.s3.eu-west-2.amazonaws.com/checkin-signature.png',
      checkOutProofPicture: 'https://tempys3-bucket.s3.eu-west-2.amazonaws.com/checkout-proof.jpg',
      checkOutSignature: 'https://tempys3-bucket.s3.eu-west-2.amazonaws.com/checkout-signature.png',
      checkOutReason: '',
      autoCheckedOut: false,
      checkInLocation: { type: 'Point', coordinates: [31.5021839, 74.4260607] },
      checkOutLocation: { type: 'Point', coordinates: [31.5021839, 74.4260607] },
    },
  },
};

describe('mapBookingUpdateResponse', () => {
  it('reads both proofs, both signatures and the new booking status', () => {
    expect(mapBookingUpdateResponse(CHECK_OUT_RESPONSE)).toEqual({
      checkInAt: '2026-09-22T12:38:39.740Z',
      checkOutAt: '2026-09-22T12:49:58.511Z',
      checkInProof: 'https://tempys3-bucket.s3.eu-west-2.amazonaws.com/checkin-proof.jpg',
      checkInSignature: 'https://tempys3-bucket.s3.eu-west-2.amazonaws.com/checkin-signature.png',
      checkOutProof: 'https://tempys3-bucket.s3.eu-west-2.amazonaws.com/checkout-proof.jpg',
      checkOutSignature: 'https://tempys3-bucket.s3.eu-west-2.amazonaws.com/checkout-signature.png',
      checkInPoint: { lat: 31.5021839, lng: 74.4260607 },
      checkOutPoint: { lat: 31.5021839, lng: 74.4260607 },
      checkOutReason: '',
      autoCheckedOut: false,
      bookingStatus: 'completed',
    });
  });

  it('handles an RTK Query payload that is already unwrapped', () => {
    const mapped = mapBookingUpdateResponse(CHECK_OUT_RESPONSE.data);
    expect(mapped.checkOutAt).toBe('2026-09-22T12:49:58.511Z');
    expect(mapped.bookingStatus).toBe('completed');
  });

  it('stays empty when the booking has no attendance yet', () => {
    expect(mapBookingUpdateResponse({ data: { status: 'active' } })).toEqual({
      checkInAt: null,
      checkOutAt: null,
      checkInProof: '',
      checkInSignature: '',
      checkOutProof: '',
      checkOutSignature: '',
      checkInPoint: null,
      checkOutPoint: null,
      checkOutReason: '',
      autoCheckedOut: false,
      bookingStatus: 'active',
    });
  });
});

describe('mapBookingLogs', () => {
  it('reads an attendance block on the logs response', () => {
    const mapped = mapBookingLogs({ data: CHECK_OUT_RESPONSE.data });
    expect(mapped.checkInAt).toBe('2026-09-22T12:38:39.740Z');
    expect(mapped.checkOutProof).toBe(
      'https://tempys3-bucket.s3.eu-west-2.amazonaws.com/checkout-proof.jpg'
    );
  });

  it('reads per-log proof / signature urls and keeps the first of each side', () => {
    const mapped = mapBookingLogs({
      data: [
        {
          status: 'checkIn',
          createdAt: '2026-09-22T12:38:39.740Z',
          proofPicture: 'https://cdn.test/in.jpg',
          signature: 'https://cdn.test/in.png',
        },
        {
          status: 'checkOut',
          createdAt: '2026-09-22T12:49:58.511Z',
          proofPicture: 'https://cdn.test/out.jpg',
          signature: 'https://cdn.test/out.png',
        },
      ],
    });

    expect(mapped).toMatchObject({
      checkInAt: '2026-09-22T12:38:39.740Z',
      checkOutAt: '2026-09-22T12:49:58.511Z',
      checkInProof: 'https://cdn.test/in.jpg',
      checkInSignature: 'https://cdn.test/in.png',
      checkOutProof: 'https://cdn.test/out.jpg',
      checkOutSignature: 'https://cdn.test/out.png',
    });
  });
});
