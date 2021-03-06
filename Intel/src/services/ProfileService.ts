import MatchEntity from '../entities/MatchEntity';
import { LinqRepository } from 'typeorm-linq-repository';
import { ProfileViewModel } from '../../../Common/ViewModels/ProfileViewModel';
import PlayerService from './PlayerService';
import ProfilePaginatedMatchesViewModel from '../../../Common/ViewModels/ProfilePaginatedMatchesViewModel';
import ProfileMatchViewModel from '../../../Common/ViewModels/ProfileMatchViewModel';
import { isSteamID } from '../utils/SteamIDChecker';
import SteamID from '../../../Common/Types/SteamID';
import Player from '../../../Common/Models/Player';

const playerService = new PlayerService();

const matchRepository = new LinqRepository(MatchEntity);

export class ProfileService {
	async getPaginatedMatches(
		identifier: string,
		pageSize: number,
		currentPage: number
	): Promise<ProfilePaginatedMatchesViewModel> {
		let profileQuery;
		if (isSteamID(identifier)) {
			profileQuery = matchRepository
				.getAll()
				.join(m => m.players)
				.where(player => player.steamid)
				.in([identifier]);
		} else {
			profileQuery = matchRepository
				.getAll()
				.join(m => m.players)
				.where(player => player.alias)
				.equal(identifier);
		}

		const totalMatchCount = await profileQuery.count();

		const paginatedMatches = await profileQuery
			.include(m => m.matchPlayerData)
			.skip(currentPage * pageSize)
			.take(Math.min(pageSize, 50));

		const profilePaginatedMatchesViewModel = new ProfilePaginatedMatchesViewModel();
		profilePaginatedMatchesViewModel.matches = paginatedMatches.map(match =>
			MatchEntity.toProfileMatchViewModel(match)
		);
		profilePaginatedMatchesViewModel.totalMatches = totalMatchCount;

		return profilePaginatedMatchesViewModel;
	}

	async getProfile(steamid: SteamID): Promise<ProfileViewModel> {
		const player = await playerService.getPlayer(steamid);
		return Player.toProfileViewModel(player);
	}
}
