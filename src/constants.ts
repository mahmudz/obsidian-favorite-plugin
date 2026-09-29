import { FavoritePluginSettings } from "./types";

export const DEFAULT_SETTINGS: FavoritePluginSettings = {
	icon: "star",
	filled: false,
	favorites: new Set<string>(),
};
