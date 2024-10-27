import { createFavoriteButton } from "src/lib/utils";
import { BasePlugin } from "./BasePlugin";
import { Platform, TFile } from "obsidian";
import FavoritePluginSettingsTab from "src/tabs/settings-tab";
import FavoritePlugin from "src/main";

export class DesktopPlugin extends BasePlugin {
	getFileExplorer(): HTMLElement | null {
		return this.app.workspace.containerEl.find(".nav-files-container");
	}

	onFolderExpand(e: PointerEvent) {
		if (this.isEnabled) {
			this.addFavoriteIconToFolder(e.currentTarget as HTMLDivElement);
		} else {
			const parentElement = e.currentTarget as HTMLElement;

			this.removeFavoriteIconFromChild(parentElement);
		}
	}

	addFavoriteIconToItem(listItem: HTMLElement | Element) {
		const filePath = listItem.getAttribute("data-path") ?? "";

		const trailingButton = createFavoriteButton(
			this.isFavorite(filePath),
			this.settings.icon,
			this.settings.filled
		);

		trailingButton.addEventListener("click", (e: PointerEvent) => {
			const favoriteButton = e.currentTarget as HTMLDivElement;
			if (favoriteButton) {
				const titleEl = favoriteButton.parentElement as HTMLDivElement;
				const filePath = titleEl.getAttribute("data-path") as string;

				this.toggleFavorite(filePath);

				if (this.isFavorite(filePath)) {
					favoriteButton.classList.add("is-favorite");

					if (this.settings.filled) {
						trailingButton.classList.add("fav-icon-filled");
					}
				} else {
					favoriteButton.classList.remove("is-favorite");
					trailingButton.classList.remove("fav-icon-filled");
				}
			}
		});

		listItem.appendChild(trailingButton);
	}

	addFavoriteIconToFolder(folderEl: HTMLElement) {
		const listItems = folderEl.querySelectorAll(
			".nav-folder, .nav-file-title"
		);

		listItems.forEach((listItem) => {
			const isAlreadyExists = listItem.find(".fav-btn");

			if (isAlreadyExists) {
				return;
			}

			if (listItem.classList.contains("nav-file-title")) {
				listItem.addClass("fav-nav-file-title");

				this.addFavoriteIconToItem(listItem);
			} else if (!listItem.classList.contains("is-collapsed")) {
				// Becuase of empty note list on inital call
				setTimeout(() => {
					this.addFavoriteIconToFolder(listItem as HTMLDivElement);
				}, 200);
			} else {
				listItem.addEventListener(
					"click",
					this.onFolderExpand.bind(this),
					{ once: true }
				);
			}
		});
	}

	addFavoriteIcons() {
		const parent = this.getFileExplorer();

		if (parent) {
			this.addFavoriteIconToFolder(parent);
		}
	}

	removeFavoriteIconFromChild(folderEl: HTMLElement) {
		const listItems = folderEl.querySelectorAll(
			".nav-folder, .nav-file-title"
		);

		listItems.forEach((listItem) => {
			if (listItem.classList.contains("nav-file-title")) {
				listItem.findAll(".fav-btn").forEach((el) => el.remove());
				listItem.removeClass("fav-nav-file-title");
			} else {
				this.removeFavoriteIconFromChild(listItem as HTMLDivElement);
			}
		});
	}

	removeFavoriteIcons() {
		const fileExplorer = this.getFileExplorer();

		if (fileExplorer) {
			this.removeFavoriteIconFromChild(fileExplorer);
		}
	}

	reload() {
		this.removeFavoriteIcons();

		this.addFavoriteIcons();
	}

	onFileCreate(file: TFile) {
		setTimeout(() => {
			const listItem = this.app.workspace.containerEl.find(
				`[data-path="${file.path}"]`
			);

			listItem.classList.add("fav-nav-file-title");

			this.addFavoriteIconToItem(listItem);
		}, 100);
	}

	async onload() {
		this.isEnabled = true;

		this.app.workspace.onLayoutReady(async () => {
			if (Platform.isTablet || Platform.isDesktop) {
				setTimeout(() => {
					this.addFavoriteIcons();

					this.getFileExplorer()
						?.findAll(".nav-file-title")
						.forEach((el) => {
							el.classList.add("fav-nav-file-title");
						});
				}, 300);

				this.app.vault.on("create", this.onFileCreate.bind(this));

				this.app.vault.on("delete", this.onFileDelete.bind(this));
			}
		});

		this.plugin.addSettingTab(
			new FavoritePluginSettingsTab(
				this.app,
				this.plugin as FavoritePlugin
			)
		);
	}

	destroy() {
		this.isEnabled = false;

		this.getFileExplorer()
			?.findAll(".nav-file-title")
			.forEach((el) => {
				el.classList.remove("fav-nav-file-title");
			});

		this.app.vault.off("create", this.onFileCreate.bind(this));

		this.app.vault.off("delete", this.onFileDelete.bind(this));

		this.removeFavoriteIcons();
	}
}
