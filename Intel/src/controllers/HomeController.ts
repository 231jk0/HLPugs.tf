import { Controller, Get, Res, UseBefore, Req, CurrentUser } from 'routing-controllers';
import config = require('config');
import { Response, Request } from 'express';
import * as steam from 'steam-login';
import PlayerService from '../services/PlayerService';
import PlayerViewModel from '../../../Common/ViewModels/PlayerViewModel';
import RequestWithPlayer from '../interfaces/RequestWithPlayer';
import Logger from '../modules/Logger';
import Player from '../../../Common/Models/Player';

const frontURL: string = config.get('app.frontURL');

@Controller()
export class HomeController {
	private readonly playerService = new PlayerService();

	@Get('/')
	frontURL(@Res() res: Response): void {
		res.redirect(frontURL);
	}

	@Get('/verify')
	@UseBefore(steam.verify())
	async login(@CurrentUser() player: Player, @Req() req: RequestWithPlayer, @Res() res: Response): Promise<void> {
		if (player.alias) {
			Logger.logInfo('Existing Login', { player });
			await this.playerService.loginExistingPlayer(player);
		} else {
			Logger.logInfo('New Login', { player });
			await this.playerService.loginNewPlayer(player);
		}

		req.player = player;
		req.session.player = player;

		res.redirect('/');
	}

	@Get('/auth')
	@UseBefore(steam.authenticate())
	authenticate(@Res() res: Response): void {
		res.redirect(frontURL);
	}
}
