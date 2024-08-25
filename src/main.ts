import { App, Platform, Plugin, PluginManifest } from "obsidian";
import { BasePlugin } from "./variants/BasePlugin";
import { DesktopPlugin } from "./variants/DesktopPlugin";
import { MobilePlugin } from "./variants/MobilePlugin";

export default class FavoritePlugin extends Plugin {
	variant: BasePlugin;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);

		if (Platform.isDesktop) {
			this.variant = new DesktopPlugin(this, this.app);
		}

		if (Platform.isMobile) {
			this.variant = new MobilePlugin(this, this.app);
		}
	}

	onload() {
		this.variant?.onload();
	}

	onunload() {
		this.variant?.destroy();
	}
}
