(function () {
	const deck = document.querySelector(".deck-viewer");
	if (!deck) return;

	const slides = [...deck.querySelectorAll(":scope > slide")];
	if (slides.length === 0) return;

	const prevButton = document.getElementById("deck-prev");
	const nextButton = document.getElementById("deck-next");
	const counter = document.getElementById("deck-counter");

	let index = 0;

	function showSlide(nextIndex) {
		index = Math.max(0, Math.min(nextIndex, slides.length - 1));
		slides.forEach((slide, i) => {
			slide.classList.toggle("is-active", i === index);
		});

		if (counter) {
			counter.textContent = `${index + 1} / ${slides.length}`;
		}
		if (prevButton) {
			prevButton.disabled = index === 0;
		}
		if (nextButton) {
			nextButton.disabled = index === slides.length - 1;
		}
	}

	function goPrev() {
		showSlide(index - 1);
	}

	function goNext() {
		showSlide(index + 1);
	}

	prevButton?.addEventListener("click", goPrev);
	nextButton?.addEventListener("click", goNext);

	document.addEventListener("keydown", (event) => {
		if (
			event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement ||
			event.target instanceof HTMLSelectElement
		) {
			return;
		}

		switch (event.key) {
			case "ArrowLeft":
			case "ArrowUp":
			case "PageUp":
				event.preventDefault();
				goPrev();
				break;
			case "ArrowRight":
			case "ArrowDown":
			case "PageDown":
			case " ":
				event.preventDefault();
				goNext();
				break;
			case "Home":
				event.preventDefault();
				showSlide(0);
				break;
			case "End":
				event.preventDefault();
				showSlide(slides.length - 1);
				break;
		}
	});

	showSlide(0);
})();
