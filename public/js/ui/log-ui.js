export function addLog(logElement, text) {
	logElement.textContent += `${text}\n`;
	logElement.scrollTop = logElement.scrollHeight;
}
