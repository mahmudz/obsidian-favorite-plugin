import { FavoritePluginSettings } from "./types";

export const DEFAULT_SETTINGS: FavoritePluginSettings = {
	icon: "star",
	filled: false,
	favorites: new Set<string>(),
};

export const SETTINGS_ICON_BTN_ID = "fv-select-icon-btn";
