import {
  helpHandler,
  clearHandler,
  bannerHandler,
  historyHandler,
  echoHandler,
  dateHandler,
  pwdHandler,
  unameHandler,
} from './system.jsx';
import { contactHandler } from './contact.jsx';
import {
  sudoHandler,
  vimHandler,
  hackHandler,
  coffeeHandler,
  exitHandler,
  themeHandler,
} from './easter-eggs.jsx';
import {
  whoamiHandler,
  aboutHandler,
  skillsHandler,
  experienceHandler,
  communityHandler,
  hackathonsHandler,
  resumeHandler,
  socialsHandler,
  githubHandler,
  linkedinHandler,
  emailHandler,
  askHandler,
  roastHandler,
  summarizeHandler,
  feedbackHandler,
  tldrHandler,
} from './domain.jsx';

export const commands = {
  help:       { category: 'system',    summary: 'Show this list',                         handler: helpHandler },
  clear:      { category: 'system',    summary: 'Clear the screen',                       handler: clearHandler },
  banner:     { category: 'system',    summary: 'Re-print the boot banner',               handler: bannerHandler },
  history:    { category: 'system',    summary: 'Show command history',                   handler: historyHandler },
  echo:       { category: 'system',    summary: 'Print arguments back',                   handler: echoHandler },
  date:       { category: 'system',    summary: 'Show current date/time',                 handler: dateHandler },
  pwd:        { category: 'system',    summary: 'Print working directory',                handler: pwdHandler },
  uname:      { category: 'system',    summary: 'Print system info',                      handler: unameHandler },

  tldr:       { category: 'identity',  summary: 'The 5-second pitch — start here',        handler: tldrHandler },
  pitch:      { category: 'identity',  summary: 'Alias of tldr',                          handler: tldrHandler },
  whoami:     { category: 'identity',  summary: 'Identity card with photo',               handler: whoamiHandler },
  about:      { category: 'identity',  summary: 'About Jainam (bio, education, interests)', handler: aboutHandler },

  skills:     { category: 'skills',    summary: 'Skill matrix (use --backend, --frontend…)', handler: skillsHandler },

  experience: { category: 'experience', summary: 'Work experience (--current, <slug>)',   handler: experienceHandler },

  community:  { category: 'community', summary: 'Community roles & impact',               handler: communityHandler },
  hackathons: { category: 'community', summary: 'Just the hackathon results',             handler: hackathonsHandler },

  resume:     { category: 'resume',    summary: 'Open resume PDF (--preview for text)',   handler: resumeHandler },

  socials:    { category: 'socials',   summary: 'All social links',                       handler: socialsHandler },
  github:     { category: 'socials',   summary: 'Open GitHub',                            handler: githubHandler },
  linkedin:   { category: 'socials',   summary: 'Open LinkedIn',                          handler: linkedinHandler },
  email:      { category: 'socials',   summary: 'Open mailto:',                           handler: emailHandler },

  ask:        { category: 'ai',        summary: 'Ask the AI — ask <question>',           handler: askHandler },
  roast:      { category: 'ai',        summary: 'Get roasted — roast me',                handler: roastHandler },
  summarize:  { category: 'ai',        summary: 'AI bio summary',                         handler: summarizeHandler },

  contact:    { category: 'system',    summary: 'Send Jainam a message',                  handler: contactHandler },
  feedback:   { category: 'system',    summary: 'Quick one-liner feedback — feedback <message>', handler: feedbackHandler },

  sudo:       { category: 'fun',       summary: 'Try your luck with sudo',                handler: sudoHandler },
  vim:        { category: 'fun',       summary: 'Open vim (good luck)',                   handler: vimHandler },
  hack:       { category: 'fun',       summary: 'Hack the matrix',                        handler: hackHandler },
  coffee:     { category: 'fun',       summary: 'Brew a virtual cup',                     handler: coffeeHandler },
  exit:       { category: 'fun',       summary: 'Say goodbye',                            handler: exitHandler },
  logout:     { category: 'fun',       summary: 'Alias of exit',                          handler: exitHandler },
  theme:      { category: 'fun',       summary: 'Toggle dark/light theme',                handler: themeHandler },
};

export function getCommandNames() {
  return Object.keys(commands);
}

export function aliasFor(name) {
  if (name === 'roast' || name === 'rm') return null;
  return commands[name] ? name : null;
}
