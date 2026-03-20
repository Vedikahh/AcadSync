export const formatTime12h = (time) => {
  if (!time) return "";
  const [hourStr, minStr] = time.split(":");
  if (!hourStr || !minStr) return time;
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minStr} ${ampm}`;
};