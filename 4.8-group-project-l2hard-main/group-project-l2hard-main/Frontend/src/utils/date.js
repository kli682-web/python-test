const getSuffix = (day) => {
  if (day > 3 && day < 21) return 'th';

  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const day = date.getDate();
  const suffix = getSuffix(day);
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}${suffix} ${month} ${hours}:${minutes}`;
};

export const formatChatDateTime = (timestamp = Date.now()) =>
  new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const parseStoredTimestamp = (value) => {
  if (!value) return Date.now();

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Date.now() : parsed;
};
