import { FileView, setIcon, TFile } from "obsidian";
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

			this.togglePath(path);
		});

		listItem.addClass("fav-nav-file-title");
		listItem.appendChild(trailingButton);
	}

	getHeaderFavoriteButton() {
		const view = this.app.workspace.getActiveViewOfType(FileView);

		if (!view) {
			return null;
		}

		const buttons = Array.from(
			view.containerEl.querySelectorAll(
				".mobile-header-fav, .view-action[aria-label='Favorite']"
			)
		).filter((el): el is HTMLElement => el instanceof HTMLElement);

		buttons.slice(1).forEach((button) => button.remove());

		const button = buttons[0];
		button?.addClass("mobile-header-fav");

		return button ?? null;
	}

	updateHeaderButtonState() {
		const filePath = this.app.workspace.getActiveFile()?.path;
		const btn = this.getHeaderFavoriteButton();
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

		this.togglePath(filePath);
	}

	private togglePath(filePath: string) {
		void this.toggleFavorite(filePath);
		this.syncButtonsForPath(filePath);

		if (this.app.workspace.getActiveFile()?.path === filePath) {
			this.updateHeaderButtonState();
		}
	}

	private registerFileMenu() {
		this.plugin.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (!(file instanceof TFile)) {
					return;
				}

				const favorite = this.isFavorite(file.path);

				menu.addItem((item) => {
					item
						.setTitle(favorite ? "Unmark as favorite" : "Mark as favorite")
						.setIcon(this.settings.icon)
						.setChecked(favorite)
						.setSection("action")
						.onClick(() => {
							this.togglePath(file.path);
						});
				});
			})
		);
	}

	addFavoriteButtonToHeader() {
		const view = this.app.workspace.getActiveViewOfType(FileView);
		const filePath = view?.file?.path;

		if (!view || !filePath) {
			return;
		}

		if (this.getHeaderFavoriteButton()) {
			this.updateHeaderButtonState();
			return;
		}

		const action = view.addAction(this.settings.icon, "Favorite", () => {
			this.onHeaderButtonClick();
		});

		action.addClass("mobile-header-fav");
		action.classList.add(
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
			this.registerFileMenu();

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
					this.addFavoriteButtonToHeader();
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

		const header = this.getHeaderFavoriteButton();

		if (header instanceof HTMLElement) {
			setIcon(header, this.settings.icon);
		}

		this.decorateOpenExplorers();
	}

	destroy(): void {
		this.isEnabled = false;
		this.clearDecorations(".mobile-fav-btn");
		this.app.workspace.containerEl
			.querySelectorAll(
				".mobile-header-fav, .view-header .view-action[aria-label='Favorite']"
			)
			.forEach((button) => button.remove());
	}
}
