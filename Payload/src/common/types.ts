import { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';
import GamemodeClassScheme from '../../../Common/Models/GamemodeScheme';
import Region from '../../../Common/Enums/Region';

export interface SiteConfiguration {
	branding: SiteBranding;
	navigation: NavItem[];
	classes: GamemodeClassScheme[];
}

export interface SiteBranding {
	siteName: string;
	siteSubTitle: string;
	logoPath: string;
}

export interface NavItem {
	type: 'tab' | 'divider' | 'module';
	tabConfig?: {
		icon: IconName;
		iconPrefix: IconPrefix;
		name: string;
		link: string;
		external: boolean;
	};
	moduleConfig?: {
		name: string;
		moduleName: string;
	};
}

export interface ChatMessageType {
	username: string;
	userid: string;
	id: string;
	timestamp: number;
	message: string;
}

export interface PreDraftRequirementType {
	name: string;
	state: boolean;
}

export interface CompletionItem {
	name?: string;
	customName?: string;
	url?: string;
}

export interface BasicAnnouncement {
	content: string;
	priority: boolean;
}

export interface FullAnnouncement extends BasicAnnouncement {
	id: number;
	region: Region;
	creator: string;
	timestamp: Date;
}
