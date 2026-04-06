const DATE_UNAVAILABLE = "Date unavailable";

export const getValidDate = (rawDate) => {
  if (!rawDate) return null;
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const formatEventDate = (
  rawDate,
  {
    locale = "en-IN",
    options = { day: "numeric", month: "short", year: "numeric" },
    fallback = DATE_UNAVAILABLE,
  } = {}
) => {
  const parsed = getValidDate(rawDate);
  if (!parsed) return fallback;
  return parsed.toLocaleDateString(locale, options);
};

export const formatEventDateWithWeekday = (rawDate, fallback = DATE_UNAVAILABLE) =>
  formatEventDate(rawDate, {
    locale: "en-IN",
    options: {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    },
    fallback,
  });

export const formatEventDateLong = (rawDate, fallback = DATE_UNAVAILABLE) =>
  formatEventDate(rawDate, {
    locale: "en-IN",
    options: {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
    fallback,
  });

export const DATE_FALLBACK_TEXT = DATE_UNAVAILABLE;
