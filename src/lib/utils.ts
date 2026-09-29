import { setIcon } from "obsidian";

export function createFavoriteButton(
	isFavorite = false,
	icon = "star",
	fillIcon = false
): HTMLElement {
	const trailingButton = document.createElement("span");
	trailingButton.classList.add("fav-btn");

	if (isFavorite) {
		trailingButton.classList.add("is-favorite");

		if (fillIcon) {
			trailingButton.classList.add("fav-icon-filled");
		}
	} else {
		trailingButton.classList.remove("is-favorite");
		trailingButton.classList.remove("fav-icon-filled");
	}

	setIcon(trailingButton, icon);

	return trailingButton;
}
