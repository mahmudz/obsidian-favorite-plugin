import { App, Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS } from "src/constants";
import { FavoritePluginSettings } from "src/types";

abstract class BasePluginContract {
	abstract onload(): void;
	abstract destroy(): void;
	abstract reload(): void;
}

export abstract class BasePlugin extends BasePluginContract {
	plugin: Plugin;
	app: App;
	isEnabled = false;
	settings: FavoritePluginSettings;
	favorites: Set<string>;

	constructor(plugin: Plugin, app: App) {
		super();

		this.plugin = plugin;
		this.app = app;
		this.init();
	}

	async init() {
		await this.loadSettings();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.plugin.loadData()
		);
		this.favorites = new Set(Object.values(this.settings.favorites));
	}

	async saveSettings() {
		await this.plugin.saveData({
			...this.settings,
			favorites: Object.assign({}, Array.from(this.favorites)),
		});
	}

	isFavorite(filePath: string): boolean {
		return this.favorites.has(filePath);
	}

	removeFavorite(filePath: string) {
		this.favorites.delete(filePath);

		this.saveSettings();
	}

	onFileDelete(file: TFile) {
		this.removeFavorite(file.path);
	}

	toggleFavorite(filePath: string) {
		if (this.isFavorite(filePath)) {
			this.favorites.delete(filePath);
		} else {
			this.favorites.add(filePath);
		}

		this.saveSettings();
	}
}
