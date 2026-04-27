import { Community, SearchParams } from '../types';

export function searchParamsFromQuery(q: URLSearchParams): SearchParams {
  const out: SearchParams = {};
  const tags = q.get('tags');
  if (tags) {
    const list = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (list.length) out.tags = list;
  }
  const author = q.get('author');
  if (author) out.author = author;
  const title = q.get('q');
  if (title) out.post_title = title;
  const from = q.get('from');
  if (from) out.start_date = from;
  const to = q.get('to');
  if (to) out.end_date = to;
  if (q.get('curated') === '1') out.curated_only = true;
  return out;
}

// Build the canonical map URL for a given community + filter combo.
// Default community → /map, others → /map/c/<id>. Filters become a query string.
export function buildMapUrl(community: Community, p: SearchParams): string {
  const base = community.isDefault ? '/map' : `/map/c/${community.id}`;
  return `${base}${queryFromSearchParams(p)}`;
}

export function queryFromSearchParams(p: SearchParams): string {
  const q = new URLSearchParams();
  if (p.tags?.length) q.set('tags', p.tags.join(','));
  if (p.author) q.set('author', p.author);
  if (p.post_title) q.set('q', p.post_title);
  if (p.start_date) q.set('from', p.start_date);
  if (p.end_date) q.set('to', p.end_date);
  if (p.curated_only) q.set('curated', '1');
  const s = q.toString();
  return s ? `?${s}` : '';
}
