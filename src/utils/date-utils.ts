export function isToday(data: string | Date): boolean {
  const hoje = new Date();
  const date = typeof data === 'string' ? new Date(data) : data;

  return (
    hoje.getFullYear() === date.getFullYear() &&
    hoje.getMonth() === date.getMonth() &&
    hoje.getDate() === date.getDate()
  );
}