export function ContactReview({ name, email, message }) {
  return (
    <div className="contact-summary">
      <div><span className="accent-2">name:    </span>{name}</div>
      <div><span className="accent-2">email:   </span>{email}</div>
      <div><span className="accent-2">message: </span>{message}</div>
      <div className="amber" style={{ marginTop: 6 }}>send? (y/n)</div>
    </div>
  );
}
