export function renderFoundWords(foundWordsElement, foundWords) {
	foundWordsElement.innerHTML = "";

	for (const foundWord of foundWords) {
		const li = document.createElement("li");
		li.textContent = `${foundWord.word} +${foundWord.points}`;
		foundWordsElement.appendChild(li);
	}
}

export function setWordFeedback(wordFeedbackElement, text) {
	wordFeedbackElement.textContent = text;
}
