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


// Auxiliary function to inject authentication info
function setSecurityHeaders(req, body?) {
    if (req.headers['authentication']) {
        var authParts = req.headers['authentication'].split(':');
        var appID = authParts[0];
        var digest = authParts[1];
        if (Apps.checkSignature(appID, digest, req['originalUrl'], body)) {
            req['s2s'] = true;
            req['appID'] = appID;
        } else {
            req['s2s-fail'] = "HMAC failed";
        }
    }
}
/**
 * This uses a special verifier to check the message authentication. 
 */
app.use(bodyParser.json({
    verify: (req, res, buf: Buffer, encoding) => {
        var str = buf.toString(encoding);
        setSecurityHeaders(req, str);
    }
}));
/**
 * Complementary middleware to take care of GET/DELETE
 */
app.use((req, res, next) => {
    if (!req['s2s'] && !req['s2s-fail'])
        setSecurityHeaders(req);
    next();
})

app.use(express.static('public'));

// Pretty logs
app.use(morgan('dev'));

app.get('/v1/info/:appID', registerRoutes.info);
app.get('/v1/info', registerRoutes.info);
app.get('/v1/icon/:appID');// TODO: finish

// registration routes
app.get('/v1/register/request/:userID', s2s.ensureServer, registerRoutes.request);
app.get('/v1/register/:id/wait', registerRoutes.wait);
app.post('/v1/register', registerRoutes.register);
app.get('/register/:id', registerRoutes.iframe);

// TODO: finish this
app.get('/register/:id');

// authentication routes
app.get('/v1/auth/request/:userID', s2s.ensureServer, authRoutes.request);
app.get('/v1/auth/:id/wait', authRoutes.wait);
app.post('/v1/auth/:id/challenge', authRoutes.challenge);
app.post('/v1/auth/', authRoutes.authtenticate);
app.get('/auth/:id', authRoutes.iframe);

// key routes
app.get('/v1/key/request/:userID', s2s.ensureServer, keys.request);
app.get('/v1/key/:id/wait', keys.wait);
app.delete('/v1/key/:id/:keyID', keys.deleteKey);
app.post('/v1/key/delete/:keyID/device', keys.deleteDevKey);
app.get('/keys/delete/:id', keys.iframe);

// user routes
app.get('/v1/users/:userID', s2s.ensureServer, users.existsUser);
app.delete('/v1/users/:userID', s2s.ensureServer, users.deleteUser);

// Listen on desired port
var port = config.get("port");
server.listen(port);
console.log("Server started on port:" + port);
