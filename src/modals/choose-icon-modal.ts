import { FuzzyMatch, FuzzySuggestModal, getIconIds, setIcon } from "obsidian";
import FavoritePlugin from "../main";

export class ChooseFromIconList extends FuzzySuggestModal<string> {
	plugin: FavoritePlugin;
	buttonEl: HTMLElement | null;

	constructor(plugin: FavoritePlugin, buttonEl: HTMLElement | null = null) {
		super(plugin.app);
		this.plugin = plugin;
		this.buttonEl = buttonEl;
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
		return getIconIds();
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

	onChooseItem(item: string): void {
		this.plugin.variant.settings.icon = item;

		if (this.buttonEl?.isConnected) {
			setIcon(this.buttonEl, item);
		}

		void this.plugin.variant.saveSettings().then(() => {
			this.plugin.variant.reload();
		});
	}
}
