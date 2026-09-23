import { DICTIONARY_WORDS } from "./generated-dictionary";
import { normalizeWord } from "./normalization";

const WORDS = new Set(DICTIONARY_WORDS);

export function isKnownWord(word: string) {
	const normalizedWord = normalizeWord(word);

	return WORDS.has(normalizedWord);
}

export function getDictionarySize() {
	return WORDS.size;
}
