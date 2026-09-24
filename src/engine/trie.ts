export type TrieNode = {
  children: Record<string, TrieNode>;
  word?: string;
};

export function createTrie(words: string[]) {
  const root: TrieNode = {
    children: {},
  };

  for (const word of words) {
    addWord(root, word);
  }

  return root;
}

function addWord(root: TrieNode, word: string) {
  let currentNode = root;

  for (const letter of word) {
    currentNode.children[letter] ??= {
      children: {},
    };

    currentNode = currentNode.children[letter];
  }

  currentNode.word = word;
}
