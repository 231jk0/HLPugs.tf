import { Socket, Server } from 'socket.io';
import { SocketIO, SocketController, OnMessage, MessageBody, ConnectedSocket, SocketRequest } from 'socket-controllers';
import ValidateClass from '../../utils/ValidateClass';
import SessionService from '../../services/SessionService';
import DebugService from '../../services/DebugService';
import SocketRequestWithPlayer from '../../interfaces/SocketRequestWithPlayer';
import PlayerService from '../../services/PlayerService';
import PlayerViewModel from '../../../../Common/ViewModels/PlayerViewModel';
import { SiteConfiguration } from '../../constants/SiteConfiguration';
import FakeLogoutRequest from '../../../../Common/Requests/FakeLogoutRequest';
import FakeAddPlayerToDraftTFClassRequest from '../../../../Common/Requests/FakeAddPlayerToDraftTFClassRequest';
import FakeAddPlayerToAllDraftTFClassesRequest from '../../../../Common/Requests/FakeAddPlayerToAllDraftTFClassesRequest';
import FakeRemovePlayerFromDraftTFClassRequest from '../../../../Common/Requests/FakeRemovePlayerFromDraftTFClassRequest';
import DraftService from '../../services/DraftService';
import DraftEvents from '../../events/DraftEvents';

@SocketController()
export default class DebugSocketController {
	private readonly draftEvents = new DraftEvents();
	private readonly playerService = new PlayerService();
	private readonly sessionService = new SessionService();
	private readonly debugService = new DebugService();
	private readonly draftService = new DraftService();

	@OnMessage('fakeLogin')
	async fakeLogin(@ConnectedSocket() socket: Socket, @SocketIO() io: Server) {
		if (process.env.NODE_ENV === 'dev') {
			if (!this.sessionService.playerExists(DebugService.FAKE_OFFLINE_STEAMID)) {
				await this.debugService.addFakePlayer(DebugService.FAKE_OFFLINE_STEAMID, socket.request.sessionID);
				const player = await this.playerService.getPlayer(DebugService.FAKE_OFFLINE_STEAMID);
				player.isCaptain = true;
				socket.request.session.player = player;
				socket.request.session.save();
				const playerViewModel = PlayerViewModel.fromPlayer(player);
				socket.emit('updateCurrentPlayer', playerViewModel);
				io.emit('addPlayerToSession', playerViewModel);
			}
		}
	}

	@OnMessage('fakeLogout')
	async fakeLogout(
		@ConnectedSocket() socket: Socket,
		@SocketIO() io: Server,
		@MessageBody() payload: FakeLogoutRequest
	) {
		if (process.env.NODE_ENV === 'dev') {
			ValidateClass(payload);
			SiteConfiguration.gamemodeClassSchemes.forEach(scheme => {
				this.draftEvents.removePlayerFromDraftTFClass(io, payload.steamid, scheme.tf2class);
			});
		}

		this.sessionService.removePlayer(payload.steamid);
		socket.request.session.player = undefined;
		socket.request.session.save();
		io.emit('removePlayerFromSession', payload.steamid);

		socket.emit('updateCurrentPlayer', new PlayerViewModel());
		this.draftService.removePlayerFromAllDraftTFClasses(payload.steamid);
		SiteConfiguration.gamemodeClassSchemes.forEach(scheme => {
			this.draftEvents.removePlayerFromDraftTFClass(io, payload.steamid, scheme.tf2class);
		});
	}

	@OnMessage('addFakePlayer')
	async addFakePlayer(@SocketIO() io: Server, @SocketRequest() request: SocketRequestWithPlayer) {
		if (process.env.NODE_ENV === 'dev') {
			const player = await this.debugService.addFakePlayer();
			const fakePlayerViewModel = PlayerViewModel.fromPlayer(player);

			io.emit('addPlayerToSession', fakePlayerViewModel);
		}
	}

	@OnMessage('fakeAddPlayerToDraftTFClass')
	fakeAddPlayerToDraftTFClass(@SocketIO() io: Server, @MessageBody() payload: FakeAddPlayerToDraftTFClassRequest) {
		if (process.env.NODE_ENV === 'dev') {
			ValidateClass(payload);
			this.draftEvents.addPlayerToDraftTFClass(io, payload.steamid, payload.draftTFClass);
		}
	}

	@OnMessage('fakeRemovePlayerFromDraftTFClass')
	fakeRemovePlayerFromDraftTFClass(
		@SocketIO() io: Server,
		@MessageBody() payload: FakeRemovePlayerFromDraftTFClassRequest
	) {
		if (process.env.NODE_ENV === 'dev') {
			ValidateClass(payload);
			this.draftEvents.removePlayerFromDraftTFClass(io, payload.steamid, payload.draftTFClass);
		}
	}

	@OnMessage('fakeAddPlayerToAllDraftTFClasses')
	fakeAddPlayerToAllDraftTFClasses(
		@SocketIO() io: Server,
		@MessageBody() payload: FakeAddPlayerToAllDraftTFClassesRequest
	) {
		if (process.env.NODE_ENV === 'dev') {
			SiteConfiguration.gamemodeClassSchemes.forEach(scheme => {
				this.draftEvents.addPlayerToDraftTFClass(io, payload.steamid, scheme.tf2class);
			});
		}
	}
}
