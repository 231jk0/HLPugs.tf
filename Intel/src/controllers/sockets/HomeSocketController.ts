import * as playerMap from '../../modules/playerMap';
import { SocketController, OnConnect, ConnectedSocket, OnMessage, SocketIO, OnDisconnect } from 'socket-controllers';
import config = require('config');
import * as dotenv from 'dotenv';
import UserViewModel from '../../../../Common/ViewModels/UserViewModel';
import PlayerService from '../../services/PlayerService';
import GamemodeSchemes from '../../../../Common/Constants/GamemodeSchemes';
import Gamemode from '../../../../Common/Enums/Gamemode';
import GamemodeClassScheme from '../../../../Common/Models/GamemodeScheme';

const env = dotenv.config().parsed;

const siteConfiguration = config.get('app.configuration');
const playerService = new PlayerService();

const currentGamemode = process.env.gamemode as Gamemode;

@SocketController()
export class HomeSocketController {

	@OnConnect()
	async playerConnected(@ConnectedSocket() socket: any) {
		socket.emit('siteConfiguration', siteConfiguration);
		if (socket.request.session.err) {
			socket.emit('serverError', socket.request.session.err);
		}

		if (socket.request.session.user) {
			const user: UserViewModel = socket.request.session.user;
			socket.emit('user', user);
		} else {
			// Used for development
			if (env.offline.toLowerCase() === 'true') {
				const user: any = await playerService.getPlayer('76561198119135809');
				socket.emit('user', user);
			} else {
				socket.emit('user', { loggedIn: false });
			}
		}
	}
	
	@OnMessage('home')
	async playerLoadedHomepage(@ConnectedSocket() socket: any, @SocketIO() io: any) {
		// Send socket all online users' information
		const playerList = await playerMap.getAllPlayers();
		socket.emit('playerData', await playerList);

		// Add new socket to session socket list
		if (socket.request.session.sockets !== undefined) {
			socket.request.session.sockets.push(socket.id);
			socket.request.session.save((e: any) => {
				if (e) throw e;
			});
			if (socket.request.session.sockets.length === 1) {
				playerMap.addPlayer(socket.request.session.id, socket.request.session.user.steamid);
				io.emit('addPlayerToData', await playerMap.getPlayer(socket.request.session.user.steamid));
			}
		}
	}

	@OnDisconnect()
	playerDisconnected(@ConnectedSocket() socket: any, @SocketIO() io: any) {
		if (!socket.request.session || socket.request.session.sockets === undefined) return;

		socket.request.session.reload((e: any) => {
			if (e !== undefined) throw e;

			const socketIndex = socket.request.session.sockets.indexOf(socket.id);

			if (socketIndex >= 0) {
				socket.request.session.sockets.splice(socketIndex, 1);
				socket.request.session.save((e: Error) => { if (e !== undefined) { throw e; } });

				if (socket.request.session.sockets.length === 0) {
					playerMap.removePlayerAllDraftTFClasses(socket.request.session.user.steamid);

					const gamemodeScheme: GamemodeClassScheme[] = GamemodeSchemes.get(currentGamemode);
					gamemodeScheme.forEach(scheme => {
						io.emit('removeFromDraftTFClass', scheme.tf2class, socket.request.session.user.steamid);
					});

					playerMap.removePlayer(socket.request.session.user.steamid);
					io.emit('removePlayerFromData', socket.request.session.user.steamid);
				}
			}
		});
	}
}