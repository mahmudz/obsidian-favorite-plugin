import { App, Plugin, setIcon, TAbstractFile, TFolder } from "obsidian";
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
	ready: Promise<void>;

	private saveQueue: Promise<void> = Promise.resolve();
	private explorerObservers: {
		observer: MutationObserver;
		container: HTMLElement;
	}[] = [];

	constructor(plugin: Plugin, app: App) {
		super();

		this.plugin = plugin;
		this.app = app;
		this.ready = this.loadSettings();
	}

	async loadSettings() {
		const data = (await this.plugin.loadData()) as {
			icon?: unknown;
			filled?: unknown;
			favorites?: unknown;
		} | null;

		this.favorites = new Set(readFavoritePaths(data?.favorites));
		this.settings = {
			icon:
				typeof data?.icon === "string" ? data.icon : DEFAULT_SETTINGS.icon,
			filled:
				typeof data?.filled === "boolean"
					? data.filled
					: DEFAULT_SETTINGS.filled,
			favorites: this.favorites,
		};
	}

	saveSettings(): Promise<void> {
		const snapshot = {
			icon: this.settings.icon,
			filled: this.settings.filled,
			favorites: Array.from(this.favorites),
		};

		const write = () => this.plugin.saveData(snapshot);
		this.saveQueue = this.saveQueue.then(write, write);
		return this.saveQueue;
	}

	isFavorite(filePath: string): boolean {
		return this.favorites.has(filePath);
	}

	removeFavorite(filePath: string) {
		this.favorites.delete(filePath);
		void this.saveSettings();
	}

	onFileDelete(file: TAbstractFile) {
		this.removeFavorite(file.path);
	}

	renameFavorite(file: TAbstractFile, oldPath: string) {
		let changed = false;

		if (file instanceof TFolder) {
			const prefix = `${oldPath}/`;

			for (const fav of Array.from(this.favorites)) {
				if (fav !== oldPath && !fav.startsWith(prefix)) {
					continue;
				}

				this.favorites.delete(fav);
				this.favorites.add(file.path + fav.slice(oldPath.length));
				changed = true;
			}
		} else if (this.favorites.has(oldPath)) {
			this.favorites.delete(oldPath);
			this.favorites.add(file.path);
			changed = true;
		}

		if (changed) {
			void this.saveSettings();
			// File explorer updates its rows in the same rename turn. Sync after that.
			window.setTimeout(() => {
				if (this.isEnabled) {
					this.syncOpenExplorerButtons();
				}
			}, 0);
		}
	}

	async toggleFavorite(filePath: string) {
		if (this.isFavorite(filePath)) {
			this.favorites.delete(filePath);
		} else {
			this.favorites.add(filePath);
		}

		await this.saveSettings();
	}

	protected registerVaultEvents() {
		this.plugin.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				this.renameFavorite(file, oldPath);
			})
		);

		this.plugin.registerEvent(
			this.app.vault.on("delete", (file) => {
				this.onFileDelete(file);
			})
		);
	}

	protected abstract addFavoriteIconToItem(listItem: HTMLElement): void;

	protected decorateOpenExplorers() {
		if (!this.isEnabled) {
			return;
		}

		this.pruneObservers();

		for (const leaf of this.app.workspace.getLeavesOfType("file-explorer")) {
			const container = leaf.view.containerEl.querySelector(
				".nav-files-container"
			);

			if (!(container instanceof HTMLElement)) {
				continue;
			}

			this.decorateTitles(container);

			if (this.explorerObservers.some((entry) => entry.container === container)) {
				continue;
			}

			const observer = new MutationObserver((mutations) => {
				if (!this.isEnabled) {
					return;
				}

				for (const mutation of mutations) {
					if (mutation.type === "attributes") {
						if (
							mutation.target instanceof HTMLElement &&
							mutation.target.matches(".nav-file-title")
						) {
							this.addFavoriteIconToItem(mutation.target);
						}
						continue;
					}

					for (const node of Array.from(mutation.addedNodes)) {
						if (node instanceof HTMLElement) {
							this.decorateTitles(node);
						}
					}
				}
			});

			observer.observe(container, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["data-path"],
			});
			this.explorerObservers.push({ observer, container });
		}
	}

	protected decorateTitles(root: ParentNode) {
		if (root instanceof HTMLElement && root.matches(".nav-file-title")) {
			this.addFavoriteIconToItem(root);
		}

		root.querySelectorAll(".nav-file-title").forEach((el) => {
			if (el instanceof HTMLElement) {
				this.addFavoriteIconToItem(el);
			}
		});
	}

	protected syncButtonsForPath(filePath: string) {
		this.forEachFileTitle((title) => {
			if (title.getAttribute("data-path") !== filePath) {
				return;
			}

			const button = title.querySelector(".fav-btn, .mobile-fav-btn");

			if (button instanceof HTMLElement) {
				this.applyFavoriteState(button, filePath);
			}
		});
	}

	protected syncOpenExplorerButtons() {
		this.forEachFileTitle((title) => {
			const filePath = title.getAttribute("data-path");

			if (!filePath) {
				return;
			}

			const button = title.querySelector(".fav-btn, .mobile-fav-btn");

			if (button instanceof HTMLElement) {
				this.applyFavoriteState(button, filePath);
			}
		});
	}

	protected forEachFileTitle(callback: (title: HTMLElement) => void) {
		for (const leaf of this.app.workspace.getLeavesOfType("file-explorer")) {
			leaf.view.containerEl.querySelectorAll(".nav-file-title").forEach((el) => {
				if (el instanceof HTMLElement) {
					callback(el);
				}
			});
		}
	}

	protected applyFavoriteState(
		button: HTMLElement,
		filePath: string,
		updateIcon = false
	) {
		const favorite = this.isFavorite(filePath);

		button.classList.toggle("is-favorite", favorite);
		button.classList.toggle(
			"fav-icon-filled",
			favorite && this.settings.filled
		);

		if (updateIcon) {
			setIcon(button, this.settings.icon);
		}
	}

	protected clearDecorations(buttonSelector: string) {
		this.disconnectObservers();

		this.forEachFileTitle((title) => {
			title.querySelectorAll(buttonSelector).forEach((button) => {
				button.remove();
			});
			title.removeClass("fav-nav-file-title");
		});
	}

	private pruneObservers() {
		this.explorerObservers = this.explorerObservers.filter((entry) => {
			if (entry.container.isConnected) {
				return true;
			}

			entry.observer.disconnect();
			return false;
		});
	}

	private disconnectObservers() {
		for (const entry of this.explorerObservers) {
			entry.observer.disconnect();
		}

		this.explorerObservers = [];
	}
}

function readFavoritePaths(stored: unknown): string[] {
	if (Array.isArray(stored)) {
		return stored.filter((item): item is string => typeof item === "string");
	}

	if (stored instanceof Set) {
		return Array.from(stored).filter(
			(item): item is string => typeof item === "string"
		);
	}

	if (stored && typeof stored === "object") {
		return Object.values(stored as Record<string, unknown>).filter(
			(item): item is string => typeof item === "string"
		);
	}

	return [];
}
