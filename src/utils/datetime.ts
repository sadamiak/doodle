const locale =
  typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";

const dateFormatter = new Intl.DateTimeFormat(locale, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatTimestampLabel = (value: string) => {
  try {
    return dateFormatter.format(new Date(value));
  } catch (error) {
    console.warn("Unable to format timestamp", error);
    return value;
  }
};
