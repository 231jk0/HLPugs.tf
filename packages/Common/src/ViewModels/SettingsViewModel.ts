import DraftTFClass from '../Models/DraftTFClass';

export default class SettingsViewModel {
	id: number;
	isNotifiableByMention: boolean;
	volume: number;
	favoriteClasses: DraftTFClass[];
	addToFavoritesAfterMatch: boolean;
	addToFavoritesOnLogin: boolean;
	audioCuesEnabled: boolean;
	voicepack: string;
	colorOfNameInChat: string;
}