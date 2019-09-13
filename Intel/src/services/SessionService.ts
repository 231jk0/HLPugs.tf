// import logger from './logger';
import * as crypto from 'crypto';
import * as uuid from 'uuid';
import store from '../modules/store';
import Player from '../entities/Player';
import PlayerNotFoundError from '../custom-errors/PlayerNotFoundError';
import SteamID from '../../../Common/Types/SteamID';
import SessionID from '../../../Common/Types/SessionID';
import PlayerViewModel from '../../../Common/ViewModels/PlayerViewModel';

const PlayerSessionMap = new Map<SteamID, SessionID>();

/**
 * A service that provides methods for the retrieval, insertion
 * and deletion of a Player entity in an in-memory collection
 * referenced by their SteamID
 */

class SessionService {
	/**
	 * Adds or updates a session ID in the Player map.
	 * @param {SessionID} sessionId - The Player's sessionId to add (or update if existing).
	 * @param {SteamID} steamid - The SteamID that references the session ID.
	 */
	async upsertPlayer(sessionId: SessionID, steamid: SteamID) {
		PlayerSessionMap.set(steamid, sessionId);
	}

	playerExists(steamid: SteamID): boolean {
		return PlayerSessionMap.has(steamid);
	}

	/**
	 * Retrieves a session ID from the map using a SteamID.
	 * @param {string} steamid - The Player to retrieve.
	 */
	getPlayer(steamid: SteamID): Promise<Player> {
		return new Promise(resolve => {
			if (PlayerSessionMap.has(steamid)) {
				const sessionId = PlayerSessionMap.get(steamid);
				store.get(sessionId, (err, session) => {
					if (err) throw new Error(err);
					resolve(session.player);
				});
			}
		});
	}

	async updatePlayer(player: Player) {
		const sessionId = PlayerSessionMap.get(player.steamid);
		await this.upsertPlayer(sessionId, player.steamid);
	}

	/**
	 * Returns all logged in players
	 */
	async getAllPlayers(): Promise<Player[]> {
		return new Promise(resolve => {
			const playersArr = Array.from(PlayerSessionMap.keys());
			const newPlayerArr = playersArr.map(steamid => this.getPlayer(steamid));
			resolve(Promise.all(newPlayerArr));
		});
	}

	/**
	 * Removes a player from the session
	 * @param {SteamID} steamid - The SteamID to remove.
	 */
	removePlayer(steamid: SteamID) {
		PlayerSessionMap.delete(steamid);
	}
	/**
	 * Removes all sessions
	 */
	clearSessions() {
		PlayerSessionMap.clear();
	}

	/**
	 *  Adds a fake session to the Player map. ( FOR DEBUGGING USE ONLY )
	 * @param {string} steamid - The fake SteamID to add
	 * @param {string} alias - The site alias of the player
	 * @return {Promise<void>} - Resolves once the Player is successfully added
	 */

	addFakePlayer(steamid: SteamID, sessionId?: SessionID): Promise<void> {
		if (process.env.NODE_ENV !== 'production') {
			return new Promise((resolve, reject) => {
				const fakeSess = {
					cookie: {
						expires: '2000000000',
						originalMaxAge: 999999999
					}
				};
				const fakeRequest = {
					sessionID: sessionId
						? sessionId
						: crypto
								.createHash('sha256')
								.update(uuid.v1())
								.update(crypto.randomBytes(256))
								.digest('hex')
				};

				// @ts-ignore
				const fakeSession = store.createSession(fakeRequest, fakeSess);
				const fakePlayer = new Player();
				fakePlayer.steamid = steamid;
				fakePlayer.alias = 'Gabe';
				fakeSession.player = fakePlayer;
				store.set(fakeSession.id, fakeSession, err => {
					if (err) reject(err);
					this.upsertPlayer(fakeSession.id, fakePlayer.steamid);
					resolve();
				});
			});
		}
	}
}

export default SessionService;