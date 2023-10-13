import { Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS } from "src/constants";
import { FavoritePluginSettings } from "src/types";
import { createFavoriteButton } from "./lib/utils";
import FavoritePluginSettingsTab from "./tabs/settings-tab";
import "../styles.css";

export default class FavoritePlugin extends Plugin {
	private isEnabled = false;

	settings: FavoritePluginSettings;
	private favorites: string[] = [];

	getFileExplorer(): HTMLElement {
		return this.app.workspace.containerEl.find(".nav-folder-children");
	}

	onFolderExpand(e: PointerEvent) {
		if (this.isEnabled) {
			this.addFavoriteIconToFolder(e.currentTarget as HTMLDivElement);
		} else {
			const parentElement = e.currentTarget as HTMLElement;

			this.removeFavoriteIconFromChild(parentElement);
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

		this.saveSettings();
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
		this.addFavoriteIconToFolder(this.getFileExplorer());
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

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);

		this.favorites = this.settings.favorites;
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
		setTimeout(() => {
			const listItem = this.app.workspace.containerEl.find(
				`[data-path="${file.path}"]`
			);

			listItem.classList.add("fav-nav-file-title");

			this.addFavoriteIconToItem(listItem);
		}, 100);
	}

	onFileDelete(file: TFile) {
		const index = this.favorites.indexOf(file.path);

		if (index !== -1) {
			this.favorites.splice(index, 1);

			this.saveSettings();
		}
	}

	async onload() {
		this.isEnabled = true;

		this.app.workspace.onLayoutReady(async () => {
			await this.loadSettings();

			this.addFavoriteIcons();

			this.getFileExplorer()
				.findAll(".nav-file-title")
				.forEach((el) => {
					el.classList.add("fav-nav-file-title");
				});

			this.app.vault.on("create", this.onFileCreate.bind(this));

			this.app.vault.on("delete", this.onFileDelete.bind(this));
		});

		this.addSettingTab(new FavoritePluginSettingsTab(this.app, this));
	}

	onunload() {
		this.isEnabled = false;

		this.getFileExplorer()
			.findAll(".nav-file-title")
			.forEach((el) => {
				el.classList.remove("fav-nav-file-title");
			});

		this.app.vault.off("create", this.onFileCreate.bind(this));

		this.app.vault.off("delete", this.onFileDelete.bind(this));

		this.removeFavoriteIcons();
	}
}
