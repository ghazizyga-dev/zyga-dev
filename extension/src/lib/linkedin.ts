const PROFILE_PATH_REGEX = /^\/in\/([^/]+)\/?$/;

export function extractLinkedInProfileSlug(pathname: string): string | null {
  const match = PROFILE_PATH_REGEX.exec(pathname);
  return match?.[1] ?? null;
}

export function buildLinkedInProfileUrl(slug: string): string {
  return `https://www.linkedin.com/in/${slug}`;
}

export function isLinkedInProfilePage(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "www.linkedin.com" &&
      PROFILE_PATH_REGEX.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}
