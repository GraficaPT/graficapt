export function getSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  let slug = params.get("slug");
  if (slug) return slug;
  const pathParts = window.location.pathname.split('/');
  return pathParts[pathParts.length - 1] || null;
}
