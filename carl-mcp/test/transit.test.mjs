/**
 * Transit link tests — parity with the Swift TransitDirections helper.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appleMapsURL, googleMapsURL, transitDirections } from '../src/transit.mjs';

test('apple maps URL matches the Swift Unified Map contract', () => {
  const url = new URL(appleMapsURL('SFO'));
  assert.equal(url.origin + url.pathname, 'https://maps.apple.com/directions');
  assert.equal(url.searchParams.get('destination'), 'SFO');
  assert.equal(url.searchParams.get('mode'), 'transit');
  assert.equal(url.searchParams.get('source'), null, 'omitting origin means current location');
});

test('origin becomes the source param', () => {
  const url = new URL(appleMapsURL('SFO', 'Oakland'));
  assert.equal(url.searchParams.get('source'), 'Oakland');
});

test('addresses with spaces and commas survive encoding', () => {
  const dest = '1 Dr Carlton B Goodlett Pl, San Francisco';
  assert.equal(new URL(appleMapsURL(dest)).searchParams.get('destination'), dest);
  assert.equal(new URL(googleMapsURL(dest)).searchParams.get('destination'), dest);
});

test('google maps URL requests transit', () => {
  const url = new URL(googleMapsURL('SFO', 'Berkeley'));
  assert.equal(url.searchParams.get('travelmode'), 'transit');
  assert.equal(url.searchParams.get('origin'), 'Berkeley');
});

test('the rendered answer nudges toward fare assistance', () => {
  const text = transitDirections({ destination: 'SFO' });
  assert.match(text, /Clipper START/);
  assert.match(text, /511/);
});
