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
  const [whoami, about, exp, skills, community, socials] = await Promise.all([
    apiGet('/api/whoami', { signal }),
    apiGet('/api/about', { signal }),
    apiGet('/api/experience', { signal }),
    apiGet('/api/skills', { signal }),
    apiGet('/api/community', { signal }),
    apiGet('/api/socials', { signal }),
  ]);
  return { whoami, about, experience: exp.experience || [], skills, community, socials: socials.socials || [] };
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
      const { whoami, about, experience, skills, community, socials } = bundle;
      const pdfUrl = `${getApiBase()}/api/resume`;

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
