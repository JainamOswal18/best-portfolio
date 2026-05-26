import { useState } from 'react';

export default function ImageRenderer({ src, initials = 'JO', alt = '' }) {
  const [errored, setErrored] = useState(false);
  const showInitials = errored || !src;
  return (
    <div className="image-frame" aria-label={alt}>
      <span className="frame-corner tl" aria-hidden="true">┌</span>
      <span className="frame-corner tr" aria-hidden="true">┐</span>
      <span className="frame-corner bl" aria-hidden="true">└</span>
      <span className="frame-corner br" aria-hidden="true">┘</span>
      <div className="frame-body">
        {showInitials ? (
          <span className="initials" aria-hidden="true">{initials}</span>
        ) : (
          <img src={src} alt={alt} loading="lazy" onError={() => setErrored(true)} />
        )}
      </div>
    </div>
  );
}
