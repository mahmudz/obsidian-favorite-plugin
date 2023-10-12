import { App, PluginSettingTab, Setting } from "obsidian";
import FavoritePlugin from "../main";
import { ChooseFromIconList } from "src/modals/choose-icon-modal";
import { SETTINGS_ICON_BTN_ID } from "src/constants";

export default class FavoritePluginSettingsTab extends PluginSettingTab {
	plugin: FavoritePlugin;

	constructor(app: App, plugin: FavoritePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h1", { text: "Favorites" });
		containerEl.createEl("p", { text: "The missing favorites plugin" });

		new Setting(containerEl)
			.setName("Favorite Icon")
			.setDesc("Choose your favorite icon")
			.addButton((el) => {
				el.setIcon(this.plugin.settings.icon);

				el.onClick(async () => {
					new ChooseFromIconList(this.plugin, false).open();
				});

				this.plugin.saveSettings();
			})
			.controlEl.children[0].setAttr("id", SETTINGS_ICON_BTN_ID);

		const donationDiv = containerEl.createEl("div", {
			cls: "donate-section",
		});

		const donateText = createEl("p", {
			text: "If you like this Plugin and are considering donating to support continued development, use the button below!",
		});

		donationDiv.appendChild(donateText);
		donationDiv.appendChild(
			this.createDonateButton("https://www.buymeacoffee.com/mahmudz")
		);
	}

	createDonateButton(link: string): HTMLElement {
		const a = createEl("a");
		a.setAttribute("href", link);
		a.addClass("buymeacoffee-img");
		a.innerHTML = `<img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee &emoji=&slug=mahmudz&button_colour=BD5FFF&font_colour=ffffff&font_family=Poppins&outline_colour=000000&coffee_colour=FFDD00" />`;
		return a;
	}
}
