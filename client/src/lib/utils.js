/** Format a date string as YYYY-MM-DD */
export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Rough character count (whitespace removed), fine for Chinese content */
export function wordCount(text) {
  return (text || '').replace(/\s+/g, '').length;
}

/** Estimated reading time in minutes (~400 chars/min) */
export function readingTime(text) {
  return Math.max(1, Math.ceil(wordCount(text) / 400));
}

/** Collect unique tags with their occurrence counts from a post list */
export function collectTags(posts) {
  const map = new Map();
  for (const post of posts) {
    for (const tag of post.tags) {
      map.set(tag, (map.get(tag) || 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
