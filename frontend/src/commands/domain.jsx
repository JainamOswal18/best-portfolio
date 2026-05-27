import { useState } from 'react';
import { apiGet, apiPost, apiStream, getApiBase } from '../api/client.js';
import { hasHelpFlag, formatHelpUsage } from './helpers.js';
import ImageRenderer from '../components/ImageRenderer.jsx';
import { renderMarkdownish } from '../components/OutputBlock.jsx';

const SKILL_CATEGORIES = ['languages', 'frontend', 'backend', 'databases', 'devops', 'system-design'];

function asError(e) {
  return <span className="error">error: {e.message || String(e)}</span>;
}

export async function whoamiHandler({ flags, abortSignal }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('whoami', 'Identity card — for the recruiter in a hurry.');
  try {
    const data = await apiGet('/api/whoami', { signal: abortSignal });
    const photoUrl = data.photo_url?.startsWith('http')
      ? data.photo_url
      : `${getApiBase()}${data.photo_url || ''}`;
    const currentLine = [data.current_role, data.current_org && `@ ${data.current_org}`]
      .filter(Boolean).join(' ');
    return (
      <div className="whoami">
        <ImageRenderer src={photoUrl} initials="JO" alt={data.name} />
        <div className="whoami-info">
          <div className="whoami-name">{data.name}</div>
          <div className="whoami-title">{data.title}</div>
          {currentLine && (
            <div className="whoami-current">
              <span className="whoami-dot" /> {data.current_role}
              {data.current_org && (<> at <span className="accent-2">{data.current_org}</span></>)}
            </div>
          )}
          <div className="whoami-kv">
            {data.years_of_experience && (
              <><span className="k">experience</span><span className="v">{data.years_of_experience}</span></>
            )}
            {data.focus?.length ? (
              <><span className="k">focus</span><span className="v">{data.focus.join(' · ')}</span></>
            ) : null}
            {data.preferred_roles?.length ? (
              <><span className="k">open to roles</span>
                <span className="v">
                  {data.preferred_roles.map((r, i) => (
                    <span className="tag" key={i}>{r}</span>
                  ))}
                </span>
              </>
            ) : null}
            {data.open_to && (<><span className="k">availability</span><span className="v">{data.open_to}</span></>)}
            {data.university && (<><span className="k">university</span><span className="v">{data.university} · CGPA <span className="accent">{data.cgpa}</span></span></>)}
            {data.location && (<><span className="k">location</span><span className="v">{data.location}</span></>)}
          </div>
        </div>
      </div>
    );
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}

export async function aboutHandler({ flags, abortSignal }) {
  if (hasHelpFlag(flags)) {
    return formatHelpUsage('about', 'About Jainam.', [
      'about --summary    one-paragraph TL;DR',
      'about --education  schooling and degree',
      'about --interests  hobbies and passions',
    ]);
  }
  try {
    const data = await apiGet('/api/about', { signal: abortSignal });
    if (flags.summary) return <div>{data.summary}</div>;
    if (flags.education) {
      const e = data.education || {};
      return (
        <div className="kv">
          <span className="k">degree</span><span className="v">{e.degree}</span>
          <span className="k">institution</span><span className="v">{e.institution}</span>
          <span className="k">years</span><span className="v">{e.years}</span>
          <span className="k">cgpa</span><span className="v">{e.cgpa}</span>
        </div>
      );
    }
    if (flags.interests) {
      const list = data.interests || [];
      return (
        <div className="list">
          {list.map((it, i) => (
            <div className="list-item" key={i}>
              <span className="bullet">▸</span>
              <span>{it}</span>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div>
        <div>{data.bio || data.summary}</div>
      </div>
    );
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}

function renderSkillCategory(category, items) {
  return (
    <div className="ascii-table">
      <div className="row">
        <span className="key">{category}</span>
        <span className="val">{items.join(', ')}</span>
      </div>
    </div>
  );
}

export async function skillsHandler({ flags, abortSignal }) {
  if (hasHelpFlag(flags)) {
    return formatHelpUsage('skills', 'Show skill matrix grouped by category.', [
      'skills                     full table',
      'skills --backend           only backend',
      ...SKILL_CATEGORIES.map((c) => `skills --${c}`),
    ]);
  }
  try {
    const filter = SKILL_CATEGORIES.find((c) => flags[c]);
    if (filter) {
      const data = await apiGet(`/api/skills/${filter}`, { signal: abortSignal });
      return renderSkillCategory(data.category || filter, data.items || []);
    }
    const data = await apiGet('/api/skills', { signal: abortSignal });
    return (
      <div className="ascii-table">
        {SKILL_CATEGORIES.filter((c) => data[c]?.length).map((c) => (
          <div className="row" key={c}>
            <span className="key">{c}</span>
            <span className="val">{data[c].join(', ')}</span>
          </div>
        ))}
      </div>
    );
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}

function renderExperience(x) {
  return (
    <div>
      <div className="section-title">{x.company} — <span className="accent-2">{x.title}</span></div>
      <div className="muted">{x.duration}{x.current ? ' · current' : ''}</div>
      <div style={{ marginTop: 6 }}>{x.summary}</div>
      {x.highlights?.length ? (
        <div className="list" style={{ marginTop: 8 }}>
          {x.highlights.map((h, i) => (
            <div className="list-item" key={i}>
              <span className="bullet">•</span>
              <span>{h}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export async function experienceHandler({ args, flags, abortSignal }) {
  if (hasHelpFlag(flags)) {
    return formatHelpUsage('experience', 'Work history.', [
      'experience              list everything',
      'experience --current    show current role(s)',
      'experience <slug>       detail by slug or fuzzy company match',
    ]);
  }
  try {
    const wantsCurrent = Boolean(flags.current) || (args.length === 1 && args[0].toLowerCase() === 'current');

    if (args.length && !wantsCurrent) {
      const q = args.join(' ').toLowerCase();
      try {
        const single = await apiGet(`/api/experience/${args[0]}`, { signal: abortSignal });
        if (single && !single.error) return renderExperience(single);
      } catch {
        /* fall through to fuzzy */
      }
      const all = await apiGet('/api/experience', { signal: abortSignal });
      const match = (all.experience || []).find(
        (x) => x.slug === args[0] || x.company?.toLowerCase().includes(q)
      );
      if (!match) return <span className="error">error: no experience matches {`"${args.join(' ')}"`}</span>;
      return renderExperience(match);
    }
    const data = await apiGet('/api/experience', { signal: abortSignal });
    let list = data.experience || [];
    if (wantsCurrent) list = list.filter((x) => x.current);
    if (!list.length) {
      return <span className="muted">{wantsCurrent ? '(no current role on record)' : '(no entries)'}</span>;
    }
    return (
      <div>
        {wantsCurrent && (
          <div className="muted" style={{ marginBottom: 8 }}>── filtered: current role only ──</div>
        )}
        {list.map((x, i) => (
          <div key={x.slug || i} style={{ marginBottom: 14 }}>
            {renderExperience(x)}
          </div>
        ))}
      </div>
    );
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}

export async function communityHandler({ flags, abortSignal }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('community', 'Community roles, impact, hackathons.');
  try {
    const data = await apiGet('/api/community', { signal: abortSignal });
    return (
      <div>
        <div className="section-title">roles</div>
        <div className="list">
          {(data.roles || []).map((r, i) => (
            <div className="list-item" key={i}>
              <span className="bullet">▸</span>
              <span className="slug">{r.title}</span>
              <span className="desc">{r.detail}</span>
            </div>
          ))}
        </div>
        {data.impact && (
          <div style={{ marginTop: 10 }}>
            <span className="accent-2">impact: </span>{data.impact}
          </div>
        )}
        {data.hackathons?.length ? (
          <div style={{ marginTop: 12 }}>
            <div className="section-title">hackathons</div>
            <div className="list">
              {data.hackathons.map((h, i) => (
                <div className="list-item" key={i}>
                  <span className="bullet">▸</span>
                  <span className="slug">{h.name}</span>
                  <span className="desc">{h.result}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}

export async function hackathonsHandler({ flags, abortSignal }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('hackathons', 'Only the hackathons list.');
  try {
    const data = await apiGet('/api/community', { signal: abortSignal });
    const list = data.hackathons || [];
    if (!list.length) return <span className="muted">(no hackathons listed)</span>;
    return (
      <div className="list">
        {list.map((h, i) => (
          <div className="list-item" key={i}>
            <span className="bullet">▸</span>
            <span className="slug">{h.name}</span>
            <span className="desc">{h.result}</span>
          </div>
        ))}
      </div>
    );
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}

function ResumeSection({ title, children }) {
  return (
    <section className="resume-section">
      <h3 className="resume-section-title">{title}</h3>
      {children}
    </section>
  );
}

async function fetchResumeBundle(signal) {
  const [init, whoami, about, exp, skills, community, socials] = await Promise.all([
    apiGet('/api/init', { signal }),
    apiGet('/api/whoami', { signal }),
    apiGet('/api/about', { signal }),
    apiGet('/api/experience', { signal }),
    apiGet('/api/skills', { signal }),
    apiGet('/api/community', { signal }),
    apiGet('/api/socials', { signal }),
  ]);
  return {
    updatedAt: init.resume_updated_at,
    whoami,
    about,
    experience: exp.experience || [],
    skills,
    community,
    socials: socials.socials || [],
  };
}

// Calendar-day difference (not 24h windows), so something at 11pm and
// something the next morning correctly report "yesterday" / "today".
function calendarDaysAgo(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { days: Math.round((nowDay - dDay) / 86400000), date: d };
}

function formatRelativeDate(iso) {
  const r = calendarDaysAgo(iso);
  if (!r) return null;
  const { days, date } = r;
  if (days < 0) return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export async function resumeHandler({ flags, abortSignal }) {
  if (hasHelpFlag(flags)) {
    return formatHelpUsage('resume', 'Open resume PDF.', [
      'resume             open PDF in new tab',
      'resume --preview   render resume in the terminal',
    ]);
  }
  try {
    if (flags.preview) {
      const bundle = await fetchResumeBundle(abortSignal);
      const { updatedAt, whoami, about, experience, skills, community, socials } = bundle;
      const pdfUrl = `${getApiBase()}/api/resume`;
      const updatedLabel = formatRelativeDate(updatedAt);

      const skillRows = [
        ['languages', skills.languages],
        ['frontend',  skills.frontend],
        ['backend',   skills.backend],
        ['databases', skills.databases],
        ['devops',    skills.devops],
        ['system-design', skills['system-design']],
      ];

      return (
        <div className="resume">
          {updatedLabel && (
            <div className="resume-stamp">
              <span className="resume-stamp-dot" />
              last updated <span className="accent">{updatedLabel}</span>
            </div>
          )}
          <header className="resume-header">
            <div className="resume-name">{whoami.name}</div>
            <div className="resume-title">{whoami.title} · {whoami.university} · CGPA {whoami.cgpa}</div>
            <div className="resume-contact">
              {socials.map((s, i) => {
                const href = s.url;
                const label = s.display || s.url.replace(/^https?:\/\/|^mailto:/, '');
                return (
                  <span key={s.name}>
                    {i > 0 && <span className="dot">·</span>}
                    <a href={href} target="_blank" rel="noreferrer noopener">{label}</a>
                  </span>
                );
              })}
            </div>
          </header>

          <ResumeSection title="education">
            <div className="resume-row">
              <div className="resume-row-left">{about.education.degree}</div>
              <div className="resume-row-right">{about.education.years}</div>
            </div>
            <div className="resume-row-sub">{about.education.institution} · CGPA {about.education.cgpa}</div>
          </ResumeSection>

          <ResumeSection title="experience">
            {experience.map((e) => (
              <article key={e.slug} className="resume-entry">
                <div className="resume-row">
                  <div className="resume-row-left"><span className="resume-company">{e.company}</span> · {e.title}{e.current ? <span className="resume-current">current</span> : null}</div>
                  <div className="resume-row-right">{e.duration}</div>
                </div>
                {e.summary && <div className="resume-summary">{e.summary}</div>}
                {e.highlights?.length ? (
                  <ul className="resume-bullets">
                    {e.highlights.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                ) : null}
              </article>
            ))}
          </ResumeSection>

          <ResumeSection title="skills">
            <div className="resume-skills">
              {skillRows.map(([label, items]) => items?.length ? (
                <div className="resume-row" key={label}>
                  <div className="resume-skill-key">{label}</div>
                  <div className="resume-skill-vals">{(items || []).join(' · ')}</div>
                </div>
              ) : null)}
            </div>
          </ResumeSection>

          <ResumeSection title="community">
            <ul className="resume-bullets">
              {(community.roles || []).map((r, i) => (
                <li key={i}><span className="resume-company">{r.title}</span> — {r.detail}</li>
              ))}
            </ul>
            {community.impact && <div className="resume-summary" style={{ marginTop: 6 }}>{community.impact}</div>}
            {community.hackathons?.length ? (
              <div style={{ marginTop: 10 }}>
                <div className="resume-skill-key" style={{ marginBottom: 4 }}>hackathons</div>
                <ul className="resume-bullets">
                  {community.hackathons.map((h, i) => (
                    <li key={i}><span className="resume-company">{h.name}</span> — {h.result}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </ResumeSection>

          <footer className="resume-footer">
            <a href={pdfUrl} target="_blank" rel="noreferrer noopener">↗ download the PDF</a>
            <span className="dot">·</span>
            <span className="muted">type <span className="accent">resume</span> to open PDF directly</span>
          </footer>
        </div>
      );
    }
    const url = `${getApiBase()}/api/resume`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return <span>Opening resume in new tab → <a href={url} target="_blank" rel="noreferrer">{url}</a></span>;
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}

async function fetchSocials(signal) {
  const data = await apiGet('/api/socials', { signal });
  return data.socials || [];
}

export async function socialsHandler({ flags, abortSignal }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('socials', 'List social/contact links.');
  try {
    const list = await fetchSocials(abortSignal);
    if (!list.length) return <span className="muted">(no socials)</span>;
    return (
      <div className="list">
        {list.map((s) => (
          <div className="list-item" key={s.name}>
            <span className="bullet">▸</span>
            <span className="slug">{s.name}</span>
            <span className="desc"><a href={s.url} target="_blank" rel="noreferrer">{s.display || s.url}</a></span>
          </div>
        ))}
      </div>
    );
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}

function makeSocialOpener(name) {
  return async ({ flags, abortSignal }) => {
    if (hasHelpFlag(flags)) return formatHelpUsage(name, `Open Jainam's ${name}.`);
    try {
      const list = await fetchSocials(abortSignal);
      const entry = list.find((s) => s.name.toLowerCase() === name);
      if (!entry) return <span className="error">error: {name} not configured</span>;
      window.open(entry.url, '_blank', 'noopener,noreferrer');
      return <span>Opening <span className="accent-2">{name}</span> → <a href={entry.url} target="_blank" rel="noreferrer">{entry.display || entry.url}</a></span>;
    } catch (e) {
      if (e.name === 'AbortError') return null;
      return asError(e);
    }
  };
}

export const githubHandler = makeSocialOpener('github');
export const linkedinHandler = makeSocialOpener('linkedin');
export const emailHandler = makeSocialOpener('email');

export function askHandler({ args, flags, abortSignal, terminal }) {
  if (hasHelpFlag(flags) || !args.length) {
    return formatHelpUsage('ask <question>', 'Ask the AI anything about Jainam.', [
      'ask what is your strongest backend project?',
    ]);
  }
  const question = args.join(' ');
  const id = terminal.openStreamBlock();
  apiStream(
    '/api/ask',
    { question },
    {
      signal: abortSignal,
      onToken: (tok) => terminal.appendToStreamBlock(id, tok),
      onDone: () => terminal.closeStreamBlock(id),
      onError: (err) => terminal.failStreamBlock(id, err),
    }
  );
  return null;
}

export async function roastHandler({ flags, abortSignal }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('roast me', 'Get roasted.');
  try {
    const data = await apiPost('/api/roast', {}, { signal: abortSignal });
    return <div className="amber">{renderMarkdownish(data.roast)}</div>;
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}

export async function summarizeHandler({ flags, abortSignal }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('summarize', 'AI-generated one-paragraph bio.');
  try {
    const data = await apiGet('/api/summarize', { signal: abortSignal });
    return <div>{renderMarkdownish(data.summary)}</div>;
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}

export async function tldrHandler({ flags, abortSignal, terminal }) {
  if (hasHelpFlag(flags)) {
    return formatHelpUsage('tldr', 'The 5-second elevator pitch — for the recruiter in a hurry.');
  }
  try {
    const whoami = await apiGet('/api/whoami', { signal: abortSignal });
    const runCmd = (c) => () => terminal.runCommand?.(c);
    return (
      <div className="tldr">
        <div className="tldr-hero">
          <span className="tldr-name">{whoami.name}</span>
          <span className="tldr-sep">·</span>
          <span className="tldr-title">{whoami.title}</span>
        </div>
        <div className="tldr-meta">
          {whoami.current_role}
          {whoami.current_org && <> at <span className="accent-2">{whoami.current_org}</span></>}
          <span className="tldr-sep">·</span>
          {whoami.location}
        </div>
        <div className="tldr-meta muted">{whoami.years_of_experience}</div>

        <div className="tldr-section">
          <div className="tldr-section-title">what i've shipped</div>
          <ul className="tldr-list">
            <li>AI-native recruiter platform — Go + TypeScript microservices on GCP, GDPR-compliant (CurlScape)</li>
            <li>Resume scoring engine — 1,000+ resumes in parallel, 45 min → 100 s (<span className="accent">27× speedup</span>) at Elite HQ</li>
            <li>ForesightFlow — 5-microservice retail analytics platform built in <span className="accent">1 month</span>, 97-KPI engine + Gemini insights</li>
            <li>video.elitehq — Masters Union MBA assessment, browser-to-GCP uploads (500 MB), Gemini 3.0 Pro multimodal eval</li>
          </ul>
        </div>

        <div className="tldr-section">
          <div className="tldr-section-title">community</div>
          <ul className="tldr-list">
            <li>GDG on Campus Organizer · 500+ students impacted via AI/Cloud/Full-Stack sessions</li>
            <li>MetaMask Ambassador · 3 meetups · 200+ developers</li>
            <li>7+ national hackathons — JPMC CFG, 100x Engineers, Innerve, Imagine</li>
          </ul>
        </div>

        <div className="tldr-cta">
          <button type="button" className="chip" onClick={runCmd('resume')}>resume</button>
          <button type="button" className="chip" onClick={runCmd('experience')}>experience</button>
          <button type="button" className="chip" onClick={runCmd('contact')}>contact</button>
          <button type="button" className="chip chip-amber" onClick={runCmd('ask what should we collab on?')}>ask AI</button>
        </div>
      </div>
    );
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}

function contribLevel(count) {
  if (!count || count === 0) return 0;
  if (count < 4)  return 1;
  if (count < 10) return 2;
  if (count < 20) return 3;
  return 4;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Aggregate contributions by month label. For each visible month, sum every
// day that falls within it, count active days, and remember the first column
// where that month starts (used to position the per-month total under the
// month label).
function buildMonthSummaries(weeks) {
  const map = new Map(); // YYYY-MM → { total, activeDays, firstCol, name }
  weeks.forEach((week, idx) => {
    week.forEach((d) => {
      if (!d.date) return;
      const ym = d.date.slice(0, 7);
      let entry = map.get(ym);
      if (!entry) {
        const name = new Date(d.date + 'T00:00:00Z').toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' }).toLowerCase();
        entry = { total: 0, activeDays: 0, firstCol: idx + 1, name };
        map.set(ym, entry);
      }
      entry.total += d.count;
      if (d.count > 0) entry.activeDays += 1;
    });
  });
  return Array.from(map.entries()).map(([ym, v]) => ({ ym, ...v }));
}

function ContributionGraph({ data }) {
  const weeks = data.weeks || [];
  const months = buildMonthSummaries(weeks);
  const cols = weeks.length;

  // Busiest month — surface in stats. Skip the first month if it's a partial
  // (i.e. the year window starts mid-month) so the highlight isn't misleading.
  const busiest = months
    .slice(months.length > 1 ? 1 : 0)
    .reduce((best, m) => (!best || m.total > best.total ? m : best), null);
  const busiestLabel = busiest
    ? `${busiest.name} · ${busiest.total.toLocaleString()}`
    : '—';

  const stats = [
    { value: data.total?.toLocaleString() ?? '0', label: 'total' },
    { value: data.active_days ?? 0, label: 'active days' },
    { value: data.top_streak ?? 0, label: 'top streak' },
    { value: data.current_streak ?? 0, label: 'current streak' },
    { value: busiestLabel, label: 'busiest month', wide: true },
  ];

  // Hover tooltip state. Tooltip's left edge is clamped to the container so
  // cells near the right/left edge don't push the tooltip off-screen. The
  // arrow position is set independently via CSS variable so it still points
  // at the actual cell even when the tooltip is offset.
  const [hover, setHover] = useState(null);
  const TIP_WIDTH = 175; // conservative — actual max content is ~155px
  const TIP_MARGIN = 10;

  const onCellEnter = (e, day) => {
    if (!day.date) return;
    const cellRect = e.currentTarget.getBoundingClientRect();
    const container = e.currentTarget.closest('.contrib-graph');
    const containerRect = container.getBoundingClientRect();
    const cellCenterX = cellRect.left - containerRect.left + cellRect.width / 2;
    const cellTopY = cellRect.top - containerRect.top;
    // Default: centered above cell. Clamp to container bounds.
    let left = cellCenterX - TIP_WIDTH / 2;
    const maxLeft = containerRect.width - TIP_WIDTH - TIP_MARGIN;
    if (left < TIP_MARGIN) left = TIP_MARGIN;
    if (left > maxLeft) left = maxLeft;
    // Arrow position relative to tooltip's left edge.
    const arrowX = Math.max(10, Math.min(TIP_WIDTH - 10, cellCenterX - left));
    setHover({ left, top: cellTopY, arrowX, date: day.date, count: day.count });
  };
  const onCellLeave = () => setHover(null);

  const hoverInfo = hover
    ? (() => {
        const d = new Date(hover.date + 'T00:00:00Z');
        const weekday = WEEKDAYS[d.getUTCDay()];
        const pretty = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
        const noun = hover.count === 1 ? 'contribution' : 'contributions';
        return { weekday, pretty, count: hover.count, noun };
      })()
    : null;

  return (
    <div className="contrib-graph">
      {hoverInfo && (
        <div
          className="contrib-tooltip"
          style={{
            left: hover.left,
            top: hover.top,
            width: TIP_WIDTH,
            '--arrow-x': `${hover.arrowX}px`,
          }}
          role="tooltip"
        >
          <div className="contrib-tooltip-count">
            <b>{hoverInfo.count}</b> {hoverInfo.noun}
          </div>
          <div className="contrib-tooltip-date">
            {hoverInfo.weekday}, {hoverInfo.pretty}
          </div>
        </div>
      )}
      <div className="contrib-header">
        <span className="contrib-title">contributions · last 52 weeks</span>
        <span className="contrib-accounts muted">{(data.accounts || []).join(' + ')}</span>
      </div>

      <div className="contrib-body">
        <div className="contrib-months" style={{ gridTemplateColumns: `18px repeat(${cols}, 1fr)` }}>
          <span />
          {months.map((m) => (
            <span key={m.ym} className="contrib-month" style={{ gridColumnStart: m.firstCol + 1 }}>
              <span className="contrib-month-name">{m.name}</span>
              <span className="contrib-month-total">{m.total}</span>
            </span>
          ))}
        </div>
        <div className="contrib-row">
          <div className="contrib-day-labels"><span>M</span><span>W</span><span>F</span></div>
          <div
            className="contrib-grid"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            aria-label={`${data.total} contributions in the last year`}
          >
            {weeks.flatMap((week, wi) =>
              week.map((day, di) => (
                <div
                  key={`${wi}-${di}`}
                  className={`contrib-cell lv-${contribLevel(day.count)}`}
                  onMouseEnter={(e) => onCellEnter(e, day)}
                  onMouseLeave={onCellLeave}
                  onFocus={(e) => onCellEnter(e, day)}
                  onBlur={onCellLeave}
                />
              )),
            )}
          </div>
        </div>
        <div className="contrib-legend">
          <span>less</span>
          <span className="contrib-cell lv-0" />
          <span className="contrib-cell lv-1" />
          <span className="contrib-cell lv-2" />
          <span className="contrib-cell lv-3" />
          <span className="contrib-cell lv-4" />
          <span>more</span>
        </div>
      </div>

      <div className="contrib-stats">
        {stats.map((s) => (
          <div key={s.label} className={s.wide ? 'wide' : ''}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function ghHandler({ flags, abortSignal }) {
  if (hasHelpFlag(flags)) {
    return formatHelpUsage('gh', 'GitHub contribution graph — last 52 weeks, both accounts combined.');
  }
  try {
    const data = await apiGet('/api/contributions', { signal: abortSignal });
    return <ContributionGraph data={data} />;
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}

export async function visitsHandler({ flags, abortSignal }) {
  if (hasHelpFlag(flags)) return formatHelpUsage('visits', 'Show total page visits.');
  try {
    const data = await apiGet('/api/visits', { signal: abortSignal });
    const n = data.count ?? 0;
    return (
      <div className="visits-card">
        <div className="visits-icon">★</div>
        <div className="visits-info">
          <div className="visits-num">{n.toLocaleString()}</div>
          <div className="visits-label muted">total visits to jainamoswal.xyz</div>
        </div>
      </div>
    );
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}

function formatGuestbookDate(iso) {
  const r = calendarDaysAgo(iso);
  if (!r) return '';
  const { days, date } = r;
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (days <= 0)   return `today · ${time}`;
  if (days === 1)  return `yesterday · ${time}`;
  if (days < 7)    return `${days}d ago · ${time}`;
  if (days < 30)   return `${Math.floor(days / 7)}w ago · ${time}`;
  const datePart = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${datePart} · ${time}`;
}

export async function guestbookHandler({ args, flags, abortSignal, terminal }) {
  if (hasHelpFlag(flags)) {
    return formatHelpUsage('guestbook', 'Leave a message or read what people left.', [
      'guestbook                          see recent entries',
      'guestbook <your message>           leave a note (you will be asked for your name next)',
    ]);
  }

  // signing path: args present → capture message, enter name-prompt mode
  if (args.length) {
    const message = args.join(' ');
    if (message.length < 3) return <span className="error">error: say a little more.</span>;
    if (message.length > 280) return <span className="error">error: max 280 chars.</span>;
    terminal.enterGuestbookMode(message);
    return (
      <div>
        <div className="muted">message: <span className="accent">{message}</span></div>
        <div className="muted" style={{ marginTop: 4 }}>
          what should we call you? (hit <span className="accent">Enter</span> for <span className="accent-2">anon</span>, or type <span className="accent">cancel</span> to bail)
        </div>
      </div>
    );
  }

  // reading path
  try {
    const data = await apiGet('/api/guestbook', { signal: abortSignal });
    const entries = data.entries || [];
    return (
      <div className="guestbook">
        <div className="guestbook-header">
          <span className="muted">{entries.length === 0 ? 'be the first to sign.' : `${entries.length} recent entries`}</span>
          <span className="muted"> · type <span className="accent">guestbook your message here</span> to sign</span>
        </div>
        {entries.length > 0 && (
          <div className="guestbook-list">
            {entries.map((e, i) => (
              <div className="guestbook-entry" key={i}>
                <div className="guestbook-entry-head">
                  <span className="guestbook-name">{e.name?.trim() || 'anon'}</span>
                  <span className="guestbook-date muted">{formatGuestbookDate(e.ts)}</span>
                </div>
                <div className="guestbook-msg">{e.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}

export async function feedbackHandler({ args, flags, abortSignal }) {
  if (hasHelpFlag(flags) || !args.length) {
    return formatHelpUsage('feedback <message>', 'Drop Jainam a one-line message. No name, no email — just say it.', [
      'feedback the matrix easter egg is fire',
      'feedback typo on the experience page',
      'feedback let\'s collab on something',
    ]);
  }
  const message = args.join(' ');
  if (message.length < 3) {
    return <span className="error">error: say a little more — at least 3 characters.</span>;
  }
  try {
    const data = await apiPost('/api/feedback', { message }, { signal: abortSignal });
    return <span className="accent">{data?.message || 'Got it. Thanks for the feedback ✦'}</span>;
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return asError(e);
  }
}
