export function normalizeWord(word: string) {
  return word
    .trim()
    .toLocaleUpperCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Œ/g, "OE")
    .replace(/Æ/g, "AE")
    .replace(/[^A-Z]/g, "");
}
