// Rule-based ATS check — runs fully in the browser.
const STOP = new Set(('a an the and or but if of to in on at for with by from as is are was were be been being this that these those it its you your we our they their will can may should would could have has had do does did not no yes more most other some such than too very just also about into over under again further then once here there when where why how all any both each few own same so only per etc using use used work working ability able strong good great experience years year team').split(' '));

const words = (s) => (s.toLowerCase().match(/[a-z][a-z+#.\-]{1,}/g) || []).map((w) => w.replace(/[.\-]+$/, '')).filter((w) => w.length > 1 && !STOP.has(w));

export function resumeText(d) {
  return [d.name, d.title, d.summary, d.skills, d.languages,
    ...(d.experience || []).flatMap((e) => [e.role, e.company, e.details]),
    ...(d.education || []).flatMap((e) => [e.degree, e.school])].filter(Boolean).join('\n');
}

export function atsScore(d, jd) {
  const text = resumeText(d);
  const wc = text.split(/\s+/).filter(Boolean).length;
  const checks = [];
  const add = (ok, label, tip, pts) => checks.push({ ok, label, tip, pts: ok ? pts : 0, max: pts });

  add(!!(d.email && d.phone), 'Contact details (email + phone)', 'Add both an email and a phone number.', 15);
  add(!!d.summary, 'Professional summary', 'Add a 2–3 line summary with your title and top skills.', 10);
  add((d.experience || []).some((e) => e.role && e.details), 'Work experience with bullet points', 'Add roles with bullet-point achievements.', 15);
  add((d.education || []).some((e) => e.degree), 'Education section', 'Add your degree and institution.', 10);
  add(((d.skills || '').split(',').filter((s) => s.trim()).length) >= 6, 'Skills list (6+ skills)', 'List at least 6 relevant skills, comma separated.', 10);
  add(wc >= 200 && wc <= 700, `Length is ideal (${wc} words)`, 'Aim for 200–700 words — one page.', 10);
  const nums = ((d.experience || []).map((e) => e.details || '').join(' ').match(/\d+/g) || []).length;
  add(nums >= 3, 'Measurable results (numbers/percentages)', 'Add metrics, e.g. “improved speed by 40%”.', 10);
  add(!!d.link, 'Profile link (LinkedIn/portfolio)', 'Add your LinkedIn or portfolio URL.', 5);

  let kwScore = 0, matched = [], missing = [];
  if (jd && jd.trim()) {
    const freq = {};
    words(jd).forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).slice(0, 25).map((x) => x[0]);
    const have = new Set(words(text));
    matched = top.filter((w) => have.has(w));
    missing = top.filter((w) => !have.has(w));
    kwScore = top.length ? Math.round((matched.length / top.length) * 40) : 0;
  }

  const base = checks.reduce((a, c) => a + c.pts, 0);
  const baseMax = checks.reduce((a, c) => a + c.max, 0);
  const hasJd = !!(jd && jd.trim());
  const score = hasJd ? Math.round(((base / baseMax) * 60) + kwScore) : Math.round((base / baseMax) * 100);
  return { score, checks, matched, missing, hasJd };
}
