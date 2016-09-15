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

import { Apps } from './models';

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
/**
 * This uses a special verifier to check the message authentication. 
 */

app.use(bodyParser.json({
    verify: (req, res, buf: Buffer, encoding) => {
        var str = buf.toString(encoding);

        if (req.headers['authentication']) {
            var authParts = req.headers['authentication'].split(':');
            var appID = authParts[0];
            var digest = authParts[1];
            if (Apps.checkSignature(appID, digest, req['originalUrl'], str)) {
                req['s2s'] = true;
                req['appID'] = appID;
            } else {
                req['s2s-fail'] = "HMAC failed";
            }
        }
    }
}));
app.use(express.static('public'));

// Pretty logs
app.use(morgan('dev'));

app.get('/v1/info/:appID', registerRoutes.info);
app.get('/v1/info', registerRoutes.info);
app.get('/v1/icon/:appID');// TODO: finish


// registration routes
app.post('/v1/register/request', s2s.ensureServer, registerRoutes.request);
app.get('/v1/register/:id/wait', registerRoutes.wait);
app.post('/v1/register', registerRoutes.register);
app.get('/register/:id', registerRoutes.iframe);

// TODO: finish this
app.get('/register/:id');

// authentication routes
app.post('/v1/auth/request', s2s.ensureServer, authRoutes.request); 
app.get('/v1/auth/:id/wait', authRoutes.wait);
app.post('/v1/auth/:id/challenge', authRoutes.challenge);
app.post('/v1/auth/', authRoutes.authtenticate);
app.get('/auth/:id', authRoutes.iframe);

// key routes
app.post('/v1/key/request', s2s.ensureServer, keys.request);
app.get('/v1/key/:id/wait', keys.wait);
app.post('/v1/key/:id/remove', keys.deleteKey);
app.get('/keys/delete/:id', keys.iframe);
app.post('/v1/keys/delete/:keyID/device', keys.deleteDevKey);

// user routes
app.post('/v1/users/exists', s2s.ensureServer, users.existsUser);
app.post('/v1/users/delete/:userID', s2s.ensureServer, users.deleteUser);

// Listen on desired port
var port = config.get("port");
server.listen(port);
console.log("Server started on port:" + port);
