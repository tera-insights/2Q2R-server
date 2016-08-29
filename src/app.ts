/// <reference path="typings/index.d.ts" />

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as passport from 'passport';
import * as session from 'express-session';
import * as exphbs from 'express-handlebars';
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

app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    helpers: {
        toJSON: function (object) {
            return JSON.stringify(object);
        }
    }
}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(express.static('public'));

// Pretty logs
app.use(morgan('dev'));

app.get('/v1/info/:appID', registerRoutes.info);
app.get('/v1/info', registerRoutes.info);
app.get('/v1/icon/:appID');// TODO: finish


// registration routes
app.post('/v1/register/request', s2s.ensureServer, registerRoutes.request);
app.get ('/v1/register/:id/wait', registerRoutes.wait);
app.post('/v1/register', registerRoutes.register);
app.get ('/register/:id', registerRoutes.iframe);

// TODO: finish this
app.get ('/register/:id');

// authentication routes
app.post('/v1/auth/request'); // TODO: finish
app.post('/v1/auth/:id/wait');
// TODO: remove, embeded into iframe
app.post('/v1/auth/challenge', s2s.ensureServer, authRoutes.challenge);
// TODO: remove
app.post('/v1/auth/server', s2s.ensureServer, authRoutes.server);
app.post('/v1/auth', authRoutes.authtenticate);

// key routes
app.post('/v1/keys/list/:userID', s2s.ensureServer, keys.getKeys);
app.post('/v1/keys/delete/:keyID/device', keys.deleteDevKey);
app.post('/v1/keys/delete/:keyID', s2s.ensureServer, keys.deleteKey);

// user routes
app.post('/v1/users/exists', s2s.ensureServer, users.existsUser);
app.post('/v1/users/delete/:userID', s2s.ensureServer, users.deleteUser);

// Listen on desired port
var port = config.get("port");
server.listen(port);
console.log("Server started on port:" + port);
