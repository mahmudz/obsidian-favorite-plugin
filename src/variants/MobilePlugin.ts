import { ItemView, Platform, setIcon } from "obsidian";
import { BasePlugin } from "./BasePlugin";

export class MobilePlugin extends BasePlugin {
	getFileListElements(parentEl: Element) {
		return parentEl.querySelectorAll(".nav-folder, .nav-file-title");
	}

	getFileExplorer(): HTMLElement {
		return this.app.workspace.getLeavesOfType("file-explorer").pop()?.view
			.containerEl as HTMLElement;
	}

	removeFavoriteIconFromChild(folderEl: Element) {
		const listItems = this.getFileListElements(folderEl);

		listItems.forEach((listItem) => {
			if (listItem.classList.contains("nav-file-title")) {
				listItem
					.findAll(".mobile-fav-btn")
					.forEach((el) => el.remove());

				listItem.removeClass("fav-nav-file-title");
			} else {
				this.removeFavoriteIconFromChild(listItem);
			}
		});
	}

	createFavoriteButton(isFavorite = false): HTMLElement {
		const trailingButton = document.createElement("span");
		trailingButton.classList.add("mobile-fav-btn");

		if (isFavorite) {
			trailingButton.classList.add("is-favorite");
		} else {
			trailingButton.classList.remove("is-favorite");
		}

		setIcon(trailingButton, this.settings.icon);

		return trailingButton;
	}

	addFavoriteIconToItem(listItem: Element) {
		const favButton = listItem.find(".mobile-fav-btn");

		const filePath = listItem.getAttribute("data-path") ?? "";

		const favorite = this.isFavorite(filePath);

		if (favButton) {
			if (favorite) {
				favButton.classList.add("is-favorite");
			} else {
				favButton.classList.remove("is-favorite");
			}

			return;
		}

		listItem.addClass("fav-nav-file-title");
		const trailingButton = this.createFavoriteButton(favorite);

		listItem.appendChild(trailingButton);
	}

	addFavoriteIconToFolder(folderEl: Element) {
		const listItems = this.getFileListElements(folderEl);

		listItems.forEach((listItem) => {
			if (listItem.classList.contains("nav-file-title")) {
				this.addFavoriteIconToItem(listItem);
			} else {
				this.addFavoriteIconToFolder(listItem);
			}
		});
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

	getSidebarToggleButton() {
		if (Platform.isTablet) {
			return this.app.workspace.containerEl?.querySelector(
				".sidebar-toggle-button"
			);
		}

		return this.app.workspace
			.getActiveViewOfType(ItemView)
			?.containerEl?.querySelector(
				'button[aria-label="Expand"]'
			) as HTMLButtonElement;
	}

	onSidebarButtonClick = () => {
		const explorer = this.getFileExplorer();

		if (!this.app.workspace.leftSplit.collapsed) {
			setTimeout(() => {
				this.addFavoriteIconToFolder(explorer);
			}, 50);
		}
	};

	registerSidebarToggleEvents() {
		const btn = this.getSidebarToggleButton();
		btn?.addEventListener("click", this.onSidebarButtonClick);
	}

	deregisterSidebarToggleEvents() {
		const btn = this.getSidebarToggleButton();
		btn?.removeEventListener("click", this.onSidebarButtonClick);
	}

	updateHeaderButtonState() {
		const filePath = this.app.workspace.getActiveFile()?.path as string;
		const btn = this.getHeaderFavoriteActionButton();

		if (this.isFavorite(filePath)) {
			btn?.classList.remove("mobile-header-fav-idle");
			btn?.classList.add("is-favorite");
		} else {
			btn?.classList.remove("is-favorite");
			btn?.classList.add("mobile-header-fav-idle");
		}
	}

	onHeaderButtonClick() {
		const filePath = this.app.workspace.getActiveFile()?.path;

		if (!filePath) {
			return;
		}

		this.toggleFavorite(filePath);

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
		this.app.workspace.on("window-open", () => {
			console.log("open");
		});

		this.app.workspace.onLayoutReady(() => {
			setTimeout(() => {
				this.addFavoriteButtonToHeader();

				this.registerSidebarToggleEvents();

				this.onSidebarButtonClick();
			}, 100);

			this.plugin.registerEvent(
				this.app.workspace.on("active-leaf-change", (leaf) => {
					if (!this.itemViewAlreadyHasButton()) {
						this.addFavoriteButtonToHeader();
					}

					this.updateHeaderButtonState();
				})
			);

			this.plugin.registerEvent(
				this.app.vault.on("delete", this.onFileDelete.bind(this))
			);
		});
	}

	reload(): void {}

	destroy(): void {
		this.isEnabled = false;

		this.getHeaderFavoriteActionButton()?.remove();
		this.deregisterSidebarToggleEvents();

		this.getFileExplorer()
			?.findAll(".nav-file-title")
			.forEach((el) => {
				el.classList.remove("fav-nav-file-title");
				el.find(".mobile-fav-btn").remove();
			});
	}
}
