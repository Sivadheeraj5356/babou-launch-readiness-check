const test = require('node:test');
const assert = require('node:assert/strict');
const { check } = require('../launch.js');

test('user-facing change wording is flagged as a campaign candidate', () => {
  const { findings } = check('change | New: one-click campaign drafts\nasset | demo video\nasset | LinkedIn post copy\nasset | docs page');
  assert.ok(findings.some((f) => f.code === 'CAMPAIGN_SIGNAL'));
});

test('chore-style change is flagged as internal', () => {
  const { findings } = check('change | chore: bump postcss dependency');
  assert.ok(findings.some((f) => f.code === 'INTERNAL_CHANGE'));
  assert.ok(!findings.some((f) => f.code === 'CAMPAIGN_SIGNAL'));
});

test('missing demo asset is flagged when candidates exist', () => {
  const { findings } = check('change | New export flow\nasset | LinkedIn post copy\nasset | docs page');
  assert.ok(findings.some((f) => f.code === 'MISSING_DEMO'));
});

test('missing social and doc assets are flagged independently', () => {
  const { findings } = check('change | Added template gallery\nasset | demo video');
  assert.ok(findings.some((f) => f.code === 'MISSING_SOCIAL'));
  assert.ok(findings.some((f) => f.code === 'MISSING_DOC_LINK'));
});

test('complete kit yields the LAUNCH_KIT_PRESENT note', () => {
  const { findings } = check('change | New export flow\nasset | demo video\nasset | tweet thread\nasset | documentation page');
  assert.ok(findings.some((f) => f.code === 'LAUNCH_KIT_PRESENT'));
  assert.ok(!findings.some((f) => /^MISSING_/.test(f.code)));
});

test('no user-facing wording yields NO_CAMPAIGN_SIGNAL', () => {
  const { findings } = check('change | refactor queue internals\nchange | dependency cleanup');
  assert.ok(findings.some((f) => f.code === 'NO_CAMPAIGN_SIGNAL'));
});

test('malformed lines are reported as unparsed and more than five candidates warns', () => {
  const input = 'not a valid line\n' + Array.from({ length: 6 }, (_, i) => `change | New feature ${i}`).join('\n') + '\nasset | demo video\nasset | tweet\nasset | docs';
  const { findings } = check(input);
  assert.ok(findings.some((f) => f.code === 'UNPARSED'));
  assert.ok(findings.some((f) => f.code === 'TOO_MANY_SIGNALS'));
});
