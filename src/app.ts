/// <reference path="typings/index.d.ts" />

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as passport from 'passport';
import * as session from 'express-session';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';

import * as config from 'config';
import * as registerRoutes from './routes/register';
import * as authRoutes from './routes/auth';
import * as s2s from './routes/s2s';
import * as keys from './routes/keys';
import * as users from './routes/users';



// Set up express and Socket.IO
var app = express();
var server = require('http').createServer(app);

app.use(bodyParser.json());

// Pretty logs
app.use(morgan('dev'));

app.get('/info/:appID', registerRoutes.info);
app.get('/info', registerRoutes.info);


// registration routes
app.post('/register/challenge', s2s.ensureServer, registerRoutes.challenge); 
app.post('/register/server',s2s.ensureServer, registerRoutes.server); 
app.post('/register',registerRoutes.register);

// authentication routes
app.post('/auth/challenge', s2s.ensureServer, authRoutes.challenge); 
app.post('/auth/server', s2s.ensureServer, authRoutes.server); 
app.post('/auth',authRoutes.authtenticate);

// key routes
app.post('/keys/list/:userID', s2s.ensureServer, keys.getKeys);
app.post('/keys/delete/:keyID/device', keys.deleteDevKey);
app.post('/keys/delete/:keyID', s2s.ensureServer, keys.deleteKey);

// user routes
app.post('/users/delete/:userID', s2s.ensureServer, users.deleteUser);

// Listen on desired port
var port = config.get("port");
server.listen(port);
console.log("Server started on port:" + port);
