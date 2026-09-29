import { createFavoriteButton } from "src/lib/utils";
import { BasePlugin } from "./BasePlugin";
import FavoritePluginSettingsTab from "src/tabs/settings-tab";
import FavoritePlugin from "src/main";

export class DesktopPlugin extends BasePlugin {
	addFavoriteIconToItem(listItem: HTMLElement) {
		if (listItem.querySelector(".fav-btn")) {
			return;
		}

		const filePath = listItem.getAttribute("data-path");

		if (!filePath) {
			return;
		}

		const trailingButton = createFavoriteButton(
			this.isFavorite(filePath),
			this.settings.icon,
			this.settings.filled
		);

		trailingButton.addEventListener("click", (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();

			const path = listItem.getAttribute("data-path");

			if (!path) {
				return;
			}

			void this.toggleFavorite(path);
			this.syncButtonsForPath(path);
		});

		listItem.addClass("fav-nav-file-title");
		listItem.appendChild(trailingButton);
	}

	reload() {
		this.forEachFileTitle((title) => {
			const button = title.querySelector(".fav-btn");

			if (!(button instanceof HTMLElement)) {
				return;
			}

			this.applyFavoriteState(
				button,
				title.getAttribute("data-path") ?? "",
				true
			);
		});

		this.decorateOpenExplorers();
	}

	onload() {
		this.isEnabled = true;

		void this.ready.then(() => {
			if (!this.isEnabled) {
				return;
			}

			this.plugin.addSettingTab(
				new FavoritePluginSettingsTab(this.app, this.plugin as FavoritePlugin)
			);

			this.registerVaultEvents();

			this.app.workspace.onLayoutReady(() => {
				this.decorateOpenExplorers();
			});

			this.plugin.registerEvent(
				this.app.workspace.on("layout-change", () => {
					this.decorateOpenExplorers();
				})
			);
		}).catch((error) => {
			console.error("Favorite Note failed to load settings", error);
		});
	}

	destroy() {
		this.isEnabled = false;
		this.clearDecorations(".fav-btn");
	}
}
