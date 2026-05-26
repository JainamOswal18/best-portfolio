import { hasHelpFlag, formatHelpUsage } from './helpers.js';

export function contactHandler({ flags, terminal }) {
  if (hasHelpFlag(flags)) {
    return formatHelpUsage('contact', 'Open multi-step form to send Jainam a message.', [
      'contact          start the form',
      'contact --cancel exit form mode',
    ]);
  }
  if (flags.cancel) {
    if (terminal.isContactMode()) {
      terminal.exitContactMode();
      return <span className="amber">contact cancelled.</span>;
    }
    return <span className="muted">not currently in contact mode.</span>;
  }
  terminal.enterContactMode();
  return (
    <div>
      <div className="amber">Starting contact form. Type --cancel or hit Ctrl+C to exit.</div>
      <div className="muted">Step 1 of 4 — what is your name?</div>
    </div>
  );
}
