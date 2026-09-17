/**
 * Cache-lifetime tests.
 *
 * These exist because the TTLs encode a judgment that is easy to flatten back
 * into one number during a later cleanup: air quality is the smallest payload
 * but the most time-critical, so it must never be given a longer life than the
 * feeds that only matter conversationally.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ttlFor, __testing } from '../src/conditions.mjs';

const { aqiAdvice, findCity, normalize } = __testing;
const MIN = 60 * 1000;

test('air quality is cached no longer than 15 minutes', () => {
  assert.ok(ttlFor('air-quality') <= 15 * MIN, 'wildfire AQI must not go stale');
});

test('the largest payload gets the longest practical life', () => {
  // weather-forecast is 167 KB vs air-quality's 37 KB, so this is where the
  // saving comes from.
  assert.ok(ttlFor('weather-forecast') > ttlFor('air-quality'));
  assert.ok(ttlFor('sports-data') > ttlFor('weather-forecast'));
});

test('an unknown feed still gets a bounded lifetime', () => {
  const ttl = ttlFor('something-new');
  assert.ok(ttl > 0 && ttl <= 60 * MIN, 'must not cache an unknown feed forever');
});

test('AQI advice escalates and always says what to do', () => {
  for (const [aqi, expect] of [
    [10, /outside/i],
    [75, /asthma|easy/i],
    [130, /limit time outdoors/i],
    [180, /stay inside|limit/i],
    [400, /emergency|indoors/i],
  ]) {
    const { label, advice } = aqiAdvice(aqi);
    assert.ok(label && label !== 'Unknown', `AQI ${aqi} should have a label`);
    assert.match(advice, expect, `AQI ${aqi} advice should be actionable`);
  }
  assert.equal(aqiAdvice(null).label, 'Unknown');
});

test('unhealthy air points at a human, not just a number', () => {
  // Above 150 someone may need somewhere to go, not a reading.
  assert.match(aqiAdvice(175).advice, /2-1-1/);
  assert.match(aqiAdvice(250).advice, /2-1-1/);
});

test('city matching tolerates case and punctuation', () => {
  const cities = [{ name: 'San Jose' }, { name: 'Palo Alto' }, { name: 'Oakland' }];
  assert.equal(findCity(cities, 'san jose').name, 'San Jose');
  assert.equal(findCity(cities, 'SAN-JOSE').name, 'San Jose');
  assert.equal(findCity(cities, 'palo').name, 'Palo Alto');
  assert.equal(findCity(cities, ''), null);
  assert.equal(findCity(cities, 'Fresno'), null);
});

test('normalize strips everything but alphanumerics', () => {
  assert.equal(normalize('St. Helena'), 'sthelena');
  assert.equal(normalize(null), '');
});
