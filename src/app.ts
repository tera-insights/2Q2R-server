/// <reference path="typings/index.d.ts" />

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as passport from 'passport';
import * as session from 'express-session';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';

import * as registerRoutes from './routes/register';
import * as authRoutes from './routes/auth';


// Local config file. 
var config = require('../config.js');

// Set up express and Socket.IO
var app = express();
var server = require('http').createServer(app);

app.use(bodyParser.json());

// Pretty logs
app.use(morgan('dev'));

// registration routes
app.post('/register/challenge', registerRoutes.challenge); // Protected
app.post('/register/server',registerRoutes.server); 
app.post('/register',registerRoutes.register);

// authentication routes
app.post('/auth/challenge', authRoutes.challenge); // Protected
app.post('/auth/server', authRoutes.server); 
app.post('/auth',authRoutes.authtenticate);


// Listen on desired port
server.listen(config.port);
console.log("Server started on port:" + config.port);
