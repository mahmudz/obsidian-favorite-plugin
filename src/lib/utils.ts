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

export function recreateNode(el: HTMLElement, withChildren = false) {
	if (withChildren) {
		const parentNode = el.parentNode as HTMLDivElement;

		parentNode.replaceChild(el.cloneNode(true), el);
	} else {
		const newEl = el.cloneNode(false);

		while (el.hasChildNodes())
			newEl.appendChild(el.firstChild as HTMLElement);

		const parentNode = el.parentNode as HTMLElement;

		parentNode.replaceChild(newEl, el);
	}
}
