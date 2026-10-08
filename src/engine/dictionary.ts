import { DICTIONARY_WORDS } from "./generated-dictionary";
import { normalizeWord } from "./normalization";
import { createTrie } from "./trie";

const WORDS = new Set(DICTIONARY_WORDS);
const TRIE = createTrie(DICTIONARY_WORDS);

export function isKnownWord(word: string) {
  return WORDS.has(normalizeWord(word));
}

export function getDictionarySize() {
  return WORDS.size;
}

export function getDictionaryTrie() {
  return TRIE;
}
