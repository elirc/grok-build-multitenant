export function parseListQuery(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Expected query object');
  const q = input.q === undefined ? '' : input.q;
  if (typeof q !== 'string' || q.trim().length > 80) throw new TypeError('Invalid q');
  const number = (value,fallback,max) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) throw new TypeError('Invalid numeric query');
    const n=Number(value);
    if (!Number.isSafeInteger(n) || n < 1 || n > max) throw new TypeError('Out of range');
    return n;
  };
  return {q:q.trim(),page:number(input.page,1,10000),pageSize:number(input.pageSize,20,100)};
}
