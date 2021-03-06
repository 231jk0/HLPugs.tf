import * as config from 'config';
import * as crypto from 'crypto';
import * as expressSession from 'express-session';
import { Server } from 'http';
import 'reflect-metadata';
import * as uuid from 'uuid';
import * as socketIO from 'socket.io';
import store from './modules/store';
import { createConnection } from 'typeorm';
import express = require('express');
import { useExpressServer, Action } from 'routing-controllers';
import { Bold, Underscore, FgYellow, Reset, consoleLogStatus, FgRed, FgGreen, FgBlue } from './utils/ConsoleColors';
import CurrentUserChecker from './utils/CurrentUserChecker';
import { useSocketServer } from 'socket-controllers';
import * as dotenv from 'dotenv';
import AddFakePlayerToSession from './middlewares/sockets/AddFakePlayerToSession';
import authorizationChecker from './utils/AuthorizationChecker';

const env = dotenv.config().parsed;

const app: express.Application = express();

const sessionConfig = expressSession({
	store,
	genid() {
		return crypto
			.createHash('sha256')
			.update(uuid.v1())
			.update(crypto.randomBytes(256))
			.digest('hex');
	},
	resave: false,
	saveUninitialized: false,
	secret: config.get('app.secret'),
	cookie: {
		secure: false,
		maxAge: 1000 * 60 * 60 * 24 * 14
	}
});

app.use(sessionConfig);
const server = new Server(app);
export const io = socketIO(server);
consoleLogStatus(`\n${Underscore}${FgBlue}HLPugs.tf Bootstrap Initializing`);
consoleLogStatus(`Synchronizing models to database with ${FgYellow}TypeORM${Reset}...\n`);
createConnection()
	.then(async () => {
		consoleLogStatus(`\n${FgGreen}Success! Entities synchronized with database`);

		useExpressServer(app, {
			defaultErrorHandler: false,
			routePrefix: '/api',
			currentUserChecker: CurrentUserChecker,
			authorizationChecker,
			cors: true,
			middlewares: [__dirname + '/middlewares/*.js', __dirname + '/middlewares/api/*.js'],
			controllers: [__dirname + '/controllers/api/*.js']
		});

		useExpressServer(app, {
			defaultErrorHandler: false,
			currentUserChecker: CurrentUserChecker,
			authorizationChecker,
			middlewares: [__dirname + '/middlewares/*.js'],
			controllers: [__dirname + '/controllers/*.js']
		});

		io.use((socket, next) => {
			sessionConfig(socket.request, socket.request.res, next);
		});

		useSocketServer(io, {
			controllers: [__dirname + '/controllers/sockets/*.js'],
			middlewares: process.env.NODE_ENV === 'dev' ? [AddFakePlayerToSession] : []
		});

		server.listen(3001, () => {
			consoleLogStatus(`${FgYellow}Express${Reset}: http://localhost:3001/api`);
			consoleLogStatus(`${FgBlue}WebClient${Reset}: http://localhost:3000`);
		});
	})
	.catch(e => {
		console.error(`\n${FgRed}${Bold}Error occured in TypeORM synchronization${Reset}`);
		console.error(`${FgRed}${e.stack}${Reset}`);
	});
