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
	applyLogos();
})();

function parseCssRgb(value) {
	const match = String(value).match(
		/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i,
	);
	if (!match) return null;
	return {
		r: Number(match[1]) / 255,
		g: Number(match[2]) / 255,
		b: Number(match[3]) / 255,
	};
}

function relativeLuminance(rgb) {
	const lin = (channel) =>
		channel <= 0.04045
			? channel / 12.92
			: ((channel + 0.055) / 1.055) ** 2.4;
	return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

/**
 * Presets ship placeholder logos. A compiled deck points `data-logo` at the
 * brand pair and swaps default vs inverted from the slide canvas, same rule
 * as the showcase. Attribution marks stay the Gratia credit.
 */
function applyLogos() {
	const root = document.querySelector(".deck-viewer");
	const fallback = root?.getAttribute("data-logo");
	const inverted = root?.getAttribute("data-logo-inverted");
	if (!fallback || !inverted) return;

	document
		.querySelectorAll("img[data-logo], slide-footer img[data-slot='logo']")
		.forEach((img) => {
			if (img.closest("attribution-box")) return;
			const explicit = img.getAttribute("data-logo");
			const host = img.closest("slide") || document.documentElement;
			const cssVar =
				explicit === "slide-surface"
					? "--color-slide-surface-background"
					: "--color-slide-background";
			const rgb = parseCssRgb(getComputedStyle(host).getPropertyValue(cssVar));
			img.src = rgb && relativeLuminance(rgb) < 0.45 ? inverted : fallback;
		});
}
