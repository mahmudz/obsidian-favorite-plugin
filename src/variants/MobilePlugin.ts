import { ItemView, setIcon } from "obsidian";
import { BasePlugin } from "./BasePlugin";

export class MobilePlugin extends BasePlugin {
	createFavoriteButton(isFavorite = false): HTMLElement {
		const trailingButton = document.createElement("span");
		trailingButton.classList.add("mobile-fav-btn");

		if (isFavorite) {
			trailingButton.classList.add("is-favorite");

			if (this.settings.filled) {
				trailingButton.classList.add("fav-icon-filled");
			}
		}

		setIcon(trailingButton, this.settings.icon);

		return trailingButton;
	}

	addFavoriteIconToItem(listItem: HTMLElement) {
		if (listItem.querySelector(".mobile-fav-btn")) {
			return;
		}

		const filePath = listItem.getAttribute("data-path");

		if (!filePath) {
			return;
		}

		const trailingButton = this.createFavoriteButton(this.isFavorite(filePath));

		trailingButton.addEventListener("click", (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();

			const path = listItem.getAttribute("data-path");

			if (!path) {
				return;
			}

			void this.toggleFavorite(path);
			this.syncButtonsForPath(path);
			this.updateHeaderButtonState();
		});

		listItem.addClass("fav-nav-file-title");
		listItem.appendChild(trailingButton);
	}

	getHeaderFavoriteActionButton() {
		const itemView = this.app.workspace.getActiveViewOfType(ItemView);

		return itemView?.containerEl.querySelector(
			'.clickable-icon.view-action[aria-label="Favorite"]'
		);
	}

	itemViewAlreadyHasButton() {
		return this.getHeaderFavoriteActionButton() != null;
	}

	updateHeaderButtonState() {
		const filePath = this.app.workspace.getActiveFile()?.path;
		const btn = this.getHeaderFavoriteActionButton();
		const favorite = filePath ? this.isFavorite(filePath) : false;

		if (favorite) {
			btn?.classList.remove("mobile-header-fav-idle");
			btn?.classList.add("is-favorite");
		} else {
			btn?.classList.remove("is-favorite");
			btn?.classList.add("mobile-header-fav-idle");
		}

		if (!filePath) {
			return;
		}

		this.forEachFileTitle((title) => {
			if (title.getAttribute("data-path") !== filePath) {
				return;
			}

			const button = title.querySelector(".mobile-fav-btn");

			if (button instanceof HTMLElement) {
				this.applyFavoriteState(button, filePath);
			}
		});
	}

	onHeaderButtonClick() {
		const filePath = this.app.workspace.getActiveFile()?.path;

		if (!filePath) {
			return;
		}

		void this.toggleFavorite(filePath);
		this.syncButtonsForPath(filePath);
		this.updateHeaderButtonState();
	}

	addFavoriteButtonToHeader() {
		const filePath = this.app.workspace.getActiveFile()?.path;

		if (!filePath) {
			return;
		}

		const itemView = this.app.workspace.getActiveViewOfType(ItemView);
		const action = itemView?.addAction(
			this.settings.icon,
			"Favorite",
			this.onHeaderButtonClick.bind(this)
		);

		action?.classList.add(
			this.isFavorite(filePath) ? "is-favorite" : "mobile-header-fav-idle"
		);
	}

	onload(): void {
		this.isEnabled = true;

		void this.ready.then(() => {
			if (!this.isEnabled) {
				return;
			}

			this.registerVaultEvents();

			this.app.workspace.onLayoutReady(() => {
				this.addFavoriteButtonToHeader();
				this.decorateOpenExplorers();
			});

			this.plugin.registerEvent(
				this.app.workspace.on("layout-change", () => {
					this.decorateOpenExplorers();
				})
			);

			this.plugin.registerEvent(
				this.app.workspace.on("active-leaf-change", () => {
					if (!this.itemViewAlreadyHasButton()) {
						this.addFavoriteButtonToHeader();
					}

					this.updateHeaderButtonState();
				})
			);
		}).catch((error) => {
			console.error("Favorite Note failed to load settings", error);
		});
	}

	reload(): void {
		this.forEachFileTitle((title) => {
			const button = title.querySelector(".mobile-fav-btn");

			if (!(button instanceof HTMLElement)) {
				return;
			}

			this.applyFavoriteState(
				button,
				title.getAttribute("data-path") ?? "",
				true
			);
		});

		const header = this.getHeaderFavoriteActionButton();

		if (header instanceof HTMLElement) {
			setIcon(header, this.settings.icon);
		}

		this.decorateOpenExplorers();
	}

	destroy(): void {
		this.isEnabled = false;
		this.clearDecorations(".mobile-fav-btn");
		this.getHeaderFavoriteActionButton()?.remove();
	}
}
