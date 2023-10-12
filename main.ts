import { createFavoriteButton } from "./src/lib/utils";
import "./styles.css";
import { Plugin } from "obsidian";
import FavoritePluginSettingsTab from "./src/tabs/settings-tab";

interface FavoritePluginSettings {
	icon: string;
}

const DEFAULT_SETTINGS: FavoritePluginSettings = {
	icon: "star",
};

export default class FavoritePlugin extends Plugin {
	settings: FavoritePluginSettings;
	private favorites: string[] = [];

	private dataFilePath(): string {
		return this.app.vault.getAbstractFileByPath("favorites.json")?.path;
	}

	async getFavorites() {
		const favoritesFile = this.dataFilePath();

		if (favoritesFile) {
			const data = await this.app.vault.adapter.read(this.dataFilePath());

			this.favorites = JSON.parse(data);
		}
	}

	saveFavorites() {
		this.app.vault.adapter.write(
			this.dataFilePath(),
			JSON.stringify(this.favorites)
		);
	}

	async setFavorites(favorites: string[]): Promise<void> {
		const dataPath = this.pluginDataFolderPath();
		const filePath = dataPath + "/favorites.json";

		try {
			await this.app.vault.modify(filePath, JSON.stringify(favorites));
		} catch (error) {
			console.error("Error writing favorites:", error);
		}
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

	addFavoriteIcon() {
		const fileExplorer = document.querySelector(".nav-folder-children");

		if (fileExplorer) {
			const listItems = fileExplorer.querySelectorAll(
				".nav-file .nav-file-title"
			);

			listItems.forEach((listItem) => {
				const filePath = listItem.getAttribute("data-path") ?? "";

				const trailingButton = createFavoriteButton(
					this.isFavorite(filePath),
					this.settings.icon
				);

				trailingButton.addEventListener("click", (e: PointerEvent) => {
					const favoriteButton = e.currentTarget;
					const titleEl = favoriteButton.parentElement;
					const filePath = titleEl.getAttribute("data-path");

					this.toggleFavorite(filePath);

					if (this.isFavorite(filePath)) {
						favoriteButton.classList.add("is-favorite");
					} else {
						favoriteButton.classList.remove("is-favorite");
					}
				});

				listItem.appendChild(trailingButton);
			});
		}
	}

	removeFavoriteIcon() {
		const fileExplorer = document.querySelector(".nav-folder-children");

		if (fileExplorer) {
			const listItems = fileExplorer.querySelectorAll(
				".nav-file .nav-file-title"
			);

			listItems.forEach((listItem) => {
				const trailingButton = listItem.querySelector("span");
				trailingButton?.remove();
			});
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
		this.removeFavoriteIcon();

		this.addFavoriteIcon();
	}

	async onload() {
		await this.getFavorites();

		await this.loadSettings();

		this.addSettingTab(new FavoritePluginSettingsTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			this.addFavoriteIcon();
		});
	}

	onunload() {
		this.removeFavoriteIcon();
	}
}
