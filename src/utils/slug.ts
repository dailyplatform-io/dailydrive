const instagramPattern = /^[a-zA-Z0-9._]{1,30}$/;

export const normalizeInstagramHandle = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
};

export const isValidInstagramHandle = (value: string) => {
  const normalized = normalizeInstagramHandle(value);
  if (!normalized) return true;
  return instagramPattern.test(normalized);
};

export const slugifySellerName = (value: string, maxLength = 120) => {
  if (!value.trim()) return '';
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.slice(0, maxLength).replace(/-+$/g, '');
};
