import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRICING_TAGS,
  ALL_TAGS,
  TAG_COLORS,
  badgeMarkdown,
  parseTaggedDescription,
  pricingTag,
  buildBadgeSuffix,
} from './badges.mjs';

const FREE = '![free](https://img.shields.io/badge/free-2489CA?style=flat-square)';
const FREEMIUM = '![freemium](https://img.shields.io/badge/freemium-F5A623?style=flat-square)';
const PAID = '![paid](https://img.shields.io/badge/paid-D33833?style=flat-square)';
const FOSS = '![FOSS](https://img.shields.io/badge/FOSS-3DA639?style=flat-square)';
const UNKNOWN = '![trial](https://img.shields.io/badge/trial-777777?style=flat-square)';

test('exports the exact supported pricing and tag vocabulary', () => {
  assert.deepEqual(PRICING_TAGS, ['free', 'freemium', 'paid']);
  assert.deepEqual(ALL_TAGS, ['FOSS', 'free', 'freemium', 'paid']);
  assert.deepEqual(TAG_COLORS, {
    FOSS: '3DA639',
    free: '2489CA',
    freemium: 'F5A623',
    paid: 'D33833',
  });
});

test('badgeMarkdown uses the expected tag labels and colors', () => {
  assert.equal(badgeMarkdown('FOSS'), FOSS);
  assert.equal(badgeMarkdown('free'), FREE);
  assert.equal(badgeMarkdown('freemium'), FREEMIUM);
  assert.equal(badgeMarkdown('paid'), PAID);
});

test('badgeMarkdown rejects unsupported tag names', () => {
  assert.throws(() => badgeMarkdown('trial'), /Unknown tag: trial/);
});

test('buildBadgeSuffix returns badges in the supplied order', () => {
  assert.equal(buildBadgeSuffix(['FOSS', 'free']), `${FOSS} ${FREE}`);
  assert.equal(buildBadgeSuffix([]), '');
});

test('parses one pricing badge and removes it from the description', () => {
  assert.deepEqual(parseTaggedDescription(`Learn quickly ${FREE}.`), {
    description: 'Learn quickly',
    tags: ['free'],
  });
});

test('parses FOSS plus a pricing badge in source order', () => {
  assert.deepEqual(parseTaggedDescription(`Explore tools ${FOSS} ${PAID}.`), {
    description: 'Explore tools',
    tags: ['FOSS', 'paid'],
  });
});

test('leaves an untagged description intact', () => {
  assert.deepEqual(parseTaggedDescription('Read this resource'), {
    description: 'Read this resource',
    tags: [],
  });
});

test('captures unknown badge names without silently accepting them as pricing', () => {
  const result = parseTaggedDescription(`Try an app ${UNKNOWN} ${FREE}.`);
  assert.deepEqual(result, { description: 'Try an app', tags: ['trial', 'free'] });
  assert.deepEqual(result.tags.filter((tag) => !ALL_TAGS.includes(tag)), ['trial']);
});

test('captures both pricing badges for downstream validation', () => {
  assert.deepEqual(parseTaggedDescription(`Try an app ${FREE} ${FREEMIUM}.`), {
    description: 'Try an app',
    tags: ['free', 'freemium'],
  });
});

test('removes trailing period and adjoining spaces after the final badge', () => {
  assert.deepEqual(parseTaggedDescription(`Read more  ${FREE}  .`), {
    description: 'Read more',
    tags: ['free'],
  });
});

test('removes badges even when they appear within the description', () => {
  assert.deepEqual(parseTaggedDescription(`Learn ${FREE} from examples`), {
    description: 'Learn from examples',
    tags: ['free'],
  });
});

test('pricingTag finds the pricing badge after FOSS', () => {
  assert.equal(pricingTag(['FOSS', 'freemium']), 'freemium');
  assert.equal(pricingTag(['FOSS', 'paid']), 'paid');
});

test('pricingTag returns null if no pricing badge exists', () => {
  assert.equal(pricingTag([]), null);
  assert.equal(pricingTag(['FOSS', 'trial']), null);
});

test('pricingTag returns the first pricing tag if given two', () => {
  assert.equal(pricingTag(['free', 'paid']), 'free');
});
