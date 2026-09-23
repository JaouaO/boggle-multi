let timerInterval = null;

export function renderTimer(timerElement, remainingSeconds) {
	timerElement.textContent = formatSeconds(remainingSeconds);
}

export function startLocalTimer({
																	timerElement,
																	startedAt,
																	durationSeconds,
																	onEnd,
																}) {
	stopLocalTimer();

	function tick() {
		const remainingSeconds = getRemainingSeconds(startedAt, durationSeconds);

		renderTimer(timerElement, remainingSeconds);

		if (remainingSeconds <= 0) {
			stopLocalTimer();

			if (typeof onEnd === "function") {
				onEnd();
			}
		}
	}

	tick();
	timerInterval = window.setInterval(tick, 250);
}

export function stopLocalTimer() {
	if (timerInterval !== null) {
		window.clearInterval(timerInterval);
		timerInterval = null;
	}
}

function getRemainingSeconds(startedAt, durationSeconds) {
	return Math.max(
		0,
		durationSeconds - Math.floor((Date.now() - startedAt) / 1000)
	);
}

function formatSeconds(totalSeconds) {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
