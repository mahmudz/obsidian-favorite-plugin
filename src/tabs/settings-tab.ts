import { App, PluginSettingTab, Setting } from "obsidian";
import FavoritePlugin from "../main";
import { ChooseFromIconList } from "src/modals/choose-icon-modal";

export default class FavoritePluginSettingsTab extends PluginSettingTab {
	plugin: FavoritePlugin;

	constructor(app: App, plugin: FavoritePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Favorite Icon")
			.setDesc("Choose your favorite icon")
			.addButton((button) => {
				button.setIcon(this.plugin.variant.settings.icon);

				button.onClick(() => {
					new ChooseFromIconList(this.plugin, button.buttonEl).open();
				});
			});

		new Setting(containerEl)
			.setName("Fill Icon")
			.setDesc("If you want to fill the icon or not")
			.addToggle((el) => {
				el.setValue(this.plugin.variant.settings.filled);

				el.onChange(async (value) => {
					this.plugin.variant.settings.filled = value;

					this.plugin.variant.saveSettings();
					this.plugin.variant.reload();
				});
			});

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

		const img = createEl("img", {
			attr: {
				src: "https://img.buymeacoffee.com/button-api/?text=Buy me a coffee &emoji=&slug=mahmudz&button_colour=BD5FFF&font_colour=ffffff&font_family=Poppins&outline_colour=000000&coffee_colour=FFDD00",
			},
		});

		a.appendChild(img);

		return a;
	}
}
