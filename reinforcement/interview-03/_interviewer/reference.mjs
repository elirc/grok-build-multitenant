export function effectiveCapabilities(grants,denies) {
  const known=new Set(['read','write','admin']);
  const denied=new Set(denies);
  return [...new Set(grants)].filter(x=>known.has(x)&&!denied.has(x)).sort();
}
