/** Escapes `%`, `_` and `\` so user input is matched literally inside an ILIKE pattern. */
export const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (c) => `\\${c}`);
