import { setIcon } from "obsidian";

export function createFavoriteButton(
	isFavorite = false,
	icon = "star"
): HTMLElement {
	const trailingButton = document.createElement("span");
	trailingButton.classList.add("fav-btn");

	if (isFavorite) {
		trailingButton.classList.add("is-favorite");
	} else {
		trailingButton.classList.remove("is-favorite");
	}

	setIcon(trailingButton, icon);

	return trailingButton;
}

export function checkHtml(htmlStr: string) {
	const reg = /<[^>]+>/g;

	return reg.test(htmlStr);
}
