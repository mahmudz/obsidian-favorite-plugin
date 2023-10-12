import { FuzzyMatch, FuzzySuggestModal, setIcon } from "obsidian";
import { appIcons } from "./app-icons";
import { SETTINGS_ICON_BTN_ID } from "../constants";
import FavoritePlugin from "../main";

export class ChooseFromIconList extends FuzzySuggestModal<string> {
	plugin: FavoritePlugin;
	issub: boolean;

	constructor(plugin: FavoritePlugin, issub = false) {
		super(plugin.app);
		this.plugin = plugin;
		this.issub = issub;
		this.setPlaceholder("Choose an icon");
	}

	private capitalJoin(string: string): string {
		const icon = string.split(" ");

		return icon
			.map((icon) => {
				return icon[0].toUpperCase() + icon.substring(1);
			})
			.join(" ");
	}

	getItems(): string[] {
		return appIcons;
	}

	getItemText(item: string): string {
		return this.capitalJoin(
			item
				.replace("feather-", "")
				.replace("remix-", "")
				.replace("bx-", "")
				.replace(/([A-Z])/g, " $1")
				.trim()
				.replace(/-/gi, " ")
		);
	}

	renderSuggestion(icon: FuzzyMatch<string>, iconItem: HTMLElement): void {
		const span = createSpan({ cls: "fv-icon-item" });
		iconItem.appendChild(span);
		setIcon(span, icon.item);
		super.renderSuggestion(icon, iconItem);
	}

	async onChooseItem(item: string): Promise<void> {
		this.plugin.settings.icon = item;

		setIcon(
			document.querySelector(
				`#${SETTINGS_ICON_BTN_ID}`
			) as HTMLButtonElement,
			item
		);

		await this.plugin.saveSettings();

		this.plugin.reload();

		setTimeout(() => {
			dispatchEvent(new Event("print-greeting-to-console"));
		}, 100);
	}
}
