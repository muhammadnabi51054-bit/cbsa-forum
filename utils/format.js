// A palette of accessible, distinct colors used to generate consistent
// "identicon-style" avatar colors from a person's name — the same trick
// Slack/Discourse/GitHub use so avatars feel branded without image uploads.
const AVATAR_PALETTE = [
  '#0B3D57', '#146C94', '#E4633B', '#B5541B',
  '#3C6E71', '#7A4B8A', '#1B5E20', '#8A4B4B',
  '#41527A', '#9C5A28'
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(name = '?') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(name = '?') {
  return AVATAR_PALETTE[hashString(name) % AVATAR_PALETTE.length];
}

// Renders a human-friendly relative time, the way every real forum does
// ("3 hours ago" rather than a raw timestamp) while falling back to a
// plain date for anything older than a week.
function timeAgo(dateInput) {
  const date = new Date(dateInput.replace(' ', 'T') + 'Z'); // SQLite stores UTC "YYYY-MM-DD HH:MM:SS"
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

module.exports = { initials, avatarColor, timeAgo };
