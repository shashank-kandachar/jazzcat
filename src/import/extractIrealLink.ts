export function extractIrealLink(input: string): string | null {
  const hrefMatch = /href=["'](irealb:\/\/[^"']+)["']/i.exec(input);
  if (hrefMatch) {
    return hrefMatch[1].replace(/&amp;/g, "&");
  }

  const looseMatch = /(irealb:\/\/[^\s"'<>]+)/i.exec(input);
  return looseMatch ? looseMatch[1].replace(/&amp;/g, "&") : null;
}
