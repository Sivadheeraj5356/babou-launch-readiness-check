// Launch-readiness review for ship-to-marketing workflows: given a product's
// changelog entries and its launch-kit assets, flags which changes look
// campaign-worthy and which launch pieces may be missing. Heuristic review of
// pasted lines. Pure functions, no DOM.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LaunchReadinessCheck = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const CAMPAIGN_RE = /\b(new|launch|introduc|added|now supports|shipping)\b/i;
  const INTERNAL_RE = /\b(chore|refactor|bump|internal|ci:|typo|cleanup|dependency)\b/i;
  const DEMO_RE = /\b(demo|video|gif|screen recording|loom)\b/i;
  const SOCIAL_RE = /\b(social|tweet|linkedin|post copy|thread)\b/i;
  const DOC_RE = /\b(docs?|documentation|guide|help center|changelog post)\b/i;

  function parseLines(input) {
    const changes = [];
    const assets = [];
    const skipped = [];
    input.split('\n').forEach((raw, i) => {
      const line = raw.trim();
      if (!line) return;
      const p = raw.split('|').map((s) => s.trim());
      if (p.length >= 2 && /^change$/i.test(p[0])) changes.push({ text: p.slice(1).join(' | '), line: i + 1 });
      else if (p.length >= 2 && /^asset$/i.test(p[0])) assets.push({ text: p.slice(1).join(' | '), line: i + 1 });
      else skipped.push(i + 1);
    });
    return { changes, assets, skipped };
  }

  function check(input) {
    const { changes, assets, skipped } = typeof input === 'string' ? parseLines(input) : input;
    const findings = [];
    const push = (level, code, text) => findings.push({ level, code, text });
    const candidates = [];

    changes.forEach((c) => {
      if (CAMPAIGN_RE.test(c.text) && !INTERNAL_RE.test(c.text)) {
        candidates.push(c);
        push('ok', 'CAMPAIGN_SIGNAL', `Line ${c.line}: "${c.text.slice(0, 60)}" reads as a user-facing change - a possible campaign candidate; verify it matters to users before building marketing around it.`);
      } else if (INTERNAL_RE.test(c.text)) {
        push('ok', 'INTERNAL_CHANGE', `Line ${c.line}: "${c.text.slice(0, 60)}" looks internal-facing (chore/refactor-style wording) - probably not campaign material; verify no user-visible behavior changed.`);
      }
    });

    if (candidates.length > 5)
      push('warn', 'TOO_MANY_SIGNALS', `${candidates.length} campaign candidates in one release - a launch narrative usually lands better focused on 1-3; verify which change actually matters most to users.`);

    if (candidates.length) {
      if (!assets.some((a) => DEMO_RE.test(a.text)))
        push('warn', 'MISSING_DEMO', `Campaign candidates exist but no demo/video-style asset was listed - launches usually need something watchable; verify whether one exists elsewhere.`);
      if (!assets.some((a) => SOCIAL_RE.test(a.text)))
        push('warn', 'MISSING_SOCIAL', `No social/post-copy asset listed - verify whether launch copy exists elsewhere.`);
      if (!assets.some((a) => DOC_RE.test(a.text)))
        push('warn', 'MISSING_DOC_LINK', `No docs or changelog-post asset listed - verify interested users have somewhere to read more.`);
    } else if (changes.length) {
      push('warn', 'NO_CAMPAIGN_SIGNAL', `None of the ${changes.length} change(s) matched user-facing wording - this release may be genuinely internal, or the notes may be under-written; verify before skipping marketing.`);
    }

    if (skipped.length) push('warn', 'UNPARSED', `Line(s) ${skipped.join(', ')} skipped - expected "change | <text>" or "asset | <text>".`);

    const missing = findings.filter((f) => /^MISSING_/.test(f.code)).length;
    if (candidates.length && !missing)
      push('ok', 'LAUNCH_KIT_PRESENT', `${candidates.length} campaign candidate(s) and demo, social and doc assets all listed - the launch kit looks complete by these heuristics; this checks presence, not quality.`);

    return { findings, stats: { changes: changes.length, assets: assets.length, candidates: candidates.length } };
  }
  return { parseLines, check };
});
