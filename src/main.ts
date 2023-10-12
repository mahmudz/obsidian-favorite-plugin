import { Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, FAVORITES_DATA_PATH } from "src/constants";
import { FavoritePluginSettings } from "src/types";
import { createFavoriteButton } from "./lib/utils";
import FavoritePluginSettingsTab from "./tabs/settings-tab";
import "../styles.css";

export default class FavoritePlugin extends Plugin {
	settings: FavoritePluginSettings;
	private favorites: string[] = [];

	private getDataFile(): TFile {
		return this.app.vault.getAbstractFileByPath(
			FAVORITES_DATA_PATH
		) as TFile;
	}

	async getFavorites() {
		new Promise((resolve, reject) => {
			const favoritesFile = this.getDataFile();

			if (favoritesFile) {
				this.app.vault
					.read(this.getDataFile())
					.then((data) => {
						this.favorites = JSON.parse(data);
						resolve(true);
					})
					.catch(() => {
						reject("Failed to load favorites.");
					});
			} else {
				reject("Failed to load favorites file.");
			}
		});
	}

	saveFavorites() {
		this.app.vault.modify(
			this.getDataFile(),
			JSON.stringify(this.favorites)
		);
	}

	isFavorite(filePath: string): boolean {
		return this.favorites.includes(filePath);
	}

	toggleFavorite(filePath: string) {
		const index = this.favorites.indexOf(filePath);

		if (index !== -1) {
			this.favorites.splice(index, 1);
		} else {
			this.favorites.push(filePath);
		}

		this.saveFavorites();
	}

	addFavoriteIconToItem(listItem: HTMLElement | Element) {
		const filePath = listItem.getAttribute("data-path") ?? "";

		const trailingButton = createFavoriteButton(
			this.isFavorite(filePath),
			this.settings.icon
		);

		trailingButton.addEventListener("click", (e: PointerEvent) => {
			const favoriteButton = e.currentTarget as HTMLDivElement;
			if (favoriteButton) {
				const titleEl = favoriteButton.parentElement as HTMLDivElement;
				const filePath = titleEl.getAttribute("data-path") as string;

				this.toggleFavorite(filePath);

				if (this.isFavorite(filePath)) {
					favoriteButton.classList.add("is-favorite");
				} else {
					favoriteButton.classList.remove("is-favorite");
				}
			}
		});

		listItem.appendChild(trailingButton);
	}

	addFavoriteIconToFolder(folderEl: HTMLElement) {
		const listItems = folderEl.querySelectorAll(
			".nav-folder, .nav-file-title"
		);

		console.log({ folderEl, listItems });

		listItems.forEach((listItem) => {
			const isAlreadyExists = listItem.find(".fav-btn");

			if (isAlreadyExists) {
				return;
			}

			if (listItem.classList.contains("nav-file-title")) {
				this.addFavoriteIconToItem(listItem);
			} else if (!listItem.classList.contains("is-collapsed")) {
				// Becuase of empty note list on inital call
				setTimeout(() => {
					this.addFavoriteIconToFolder(listItem as HTMLElement);
				}, 200);
			} else {
				listItem.addEventListener(
					"click",
					(e: PointerEvent) => {
						const treeEl = e.currentTarget as HTMLDivElement;
						this.addFavoriteIconToFolder(treeEl);
					},
					{ once: true }
				);
			}
		});
	}

	removeFavoriteIconFromItem(listItem: HTMLElement | Element) {
		const trailingButton = listItem.querySelector("span");

		trailingButton?.remove();
	}

	addFavoriteIcons() {
		const fileExplorer = this.app.workspace.containerEl.find(
			".nav-folder-children"
		);

		this.addFavoriteIconToFolder(fileExplorer);

		// if (fileExplorer) {
		// 	const listItems = fileExplorer.querySelectorAll(".nav-file-title");

		// 	listItems.forEach((listItem) =>
		// 		this.addFavoriteIconToItem(listItem)
		// 	);
		// }
	}

	removeFavoriteIcons() {
		const fileExplorer = document.querySelector(".nav-folder-children");

		if (fileExplorer) {
			const listItems = fileExplorer.querySelectorAll(".nav-file-title");

			listItems.forEach((listItem) =>
				this.removeFavoriteIconFromItem(listItem)
			);
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData({
			...this.settings,
			favorites: this.favorites,
		});
	}

	reload() {
		this.removeFavoriteIcons();

		this.addFavoriteIcons();
	}

	onFileCreate(file: TFile) {
		this.reload();
	}

	onTreeFolderExpand(event: PointerEvent) {
		const treeEl = event.currentTarget as HTMLDivElement;

		const listItems = treeEl.querySelectorAll(".nav-file .nav-file-title");

		listItems.forEach((listItem) => this.addFavoriteIconToItem(listItem));
	}

	async onload() {
		this.app.workspace.onLayoutReady(async () => {
			await this.getFavorites();

			await this.loadSettings();

			this.addFavoriteIcons();

			this.app.vault.on("create", this.onFileCreate);
		});

		this.addSettingTab(new FavoritePluginSettingsTab(this.app, this));
	}

	onunload() {
		this.app.vault.off("create", this.onFileCreate);

		this.removeFavoriteIcons();
	}
}
