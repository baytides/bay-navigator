/**
 * Expiry flare + lifecycle logic for time-limited programs.
 *
 * A program may carry an optional `expires` date (YYYY-MM-DD) marking when a
 * time-sensitive offer (e.g. a free-download window) closes. Lifecycle:
 *
 *   > SOON_DAYS before expiry .......... no flare, shown normally
 *   <= SOON_DAYS before expiry ......... "ending soon" flare (amber; red <= URGENT_DAYS)
 *   expiry day ......................... still live (counts as 0 days left)
 *   1..GRACE_DAYS days after expiry .... "Expired" flare, still shown (grace period)
 *   > GRACE_DAYS days after expiry ..... hidden from the directory entirely
 *
 * The grace period lets visitors see a listing that just lapsed before it
 * disappears. Shared by ProgramCard (build-time, server) and ProgramDetailModal
 * (runtime, client) so the threshold rules stay in one place.
 */

/** Show the "ending soon" flare once the offer is this close (inclusive). */
export const SOON_DAYS = 30;
/** Escalate the "ending soon" flare to an urgent (red) style at or under this many days. */
export const URGENT_DAYS = 7;
/** Keep an expired listing visible (with an "Expired" flare) for this many days, then hide it. */
export const GRACE_DAYS = 7;

export interface ExpiryFlare {
  /** 'soon' = not yet expired; 'expired' = past expiry but within the grace window. */
  state: 'soon' | 'expired';
  /** Whole calendar days remaining (0 = expires today; negative once past expiry). */
  daysLeft: number;
  /** True when within URGENT_DAYS of expiry — render the "soon" flare in red. */
  urgent: boolean;
  /** Badge text, e.g. "Free download ends Jul 6, 2026" or "Expired Jul 6, 2026". */
  label: string;
  /** Screen-reader / tooltip text, e.g. "Only 19 days left" or "Expired 3 days ago". */
  srText: string;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Whole calendar days from today until `expires` (0 = today, negative = past).
 * Returns null when there's no date or it can't be parsed.
 */
function calcDaysLeft(expires: string | null | undefined, now: Date): number | null {
  if (!expires) return null;
  const end = new Date(`${expires}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;

  // Compare whole calendar days so the offer stays live through its final day
  // (daysLeft === 0) and lapses the day after — independent of time-of-day.
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - startOfToday.getTime()) / msPerDay);
}

/**
 * Compute the expiry flare for a program.
 *
 * @param expires      ISO date (YYYY-MM-DD) the time-limited offer ends.
 * @param customLabel  Optional prefix for the "ending soon" badge (default "Ends").
 *                     For the parks pass this is "Free download ends", since the
 *                     pass itself stays valid after the free-download window closes.
 *                     Ignored once expired (the badge reads "Expired <date>").
 * @param now          Reference time (defaults to current time; injectable for tests).
 * @returns The flare, or null when there's no date, it's unparseable, still more
 *          than SOON_DAYS away, or past expiry by more than GRACE_DAYS.
 */
export function getExpiryFlare(
  expires?: string | null,
  customLabel?: string | null,
  now: Date = new Date()
): ExpiryFlare | null {
  const daysLeft = calcDaysLeft(expires, now);
  if (daysLeft === null) return null;

  const end = new Date(`${expires}T00:00:00`);

  // Still upcoming (or today): "ending soon" flare within the window.
  if (daysLeft >= 0) {
    if (daysLeft > SOON_DAYS) return null;
    const prefix = customLabel?.trim() || 'Ends';
    const srText =
      daysLeft === 0 ? 'Ends today' : `Only ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
    return {
      state: 'soon',
      daysLeft,
      urgent: daysLeft <= URGENT_DAYS,
      label: `${prefix} ${formatDate(end)}`,
      srText,
    };
  }

  // Past expiry: show an "Expired" flare during the grace window, then nothing.
  const daysSince = -daysLeft;
  if (daysSince > GRACE_DAYS) return null;
  return {
    state: 'expired',
    daysLeft,
    urgent: false,
    label: `Expired ${formatDate(end)}`,
    srText: daysSince === 1 ? 'Expired yesterday' : `Expired ${daysSince} days ago`,
  };
}

/**
 * Whether a listing should be auto-hidden from the directory: it has an expiry
 * date that is more than GRACE_DAYS in the past. Expired-but-within-grace
 * listings stay visible (with the "Expired" flare) so visitors can see they
 * lapsed before they disappear.
 */
export function isExpiredHidden(expires?: string | null, now: Date = new Date()): boolean {
  const daysLeft = calcDaysLeft(expires, now);
  if (daysLeft === null) return false;
  return daysLeft < -GRACE_DAYS;
}
