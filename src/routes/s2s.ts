/// <reference path="../typings/index.d.ts" />

/**
 * This file provides a method to ensure the requests are server-to-server
 * authenicated requests. 
 */

// Local config file.
var config = require('../config.js');

import * as express from 'express';

export function ensureServer(req: express.Request, res: express.Response, next: Function) {
    switch (config.serverAuth) {
        case "token":
            var tokens = config.authTokens;
            var token = req.body.token;
            var requestor = tokens[token];
            if (requestor) { // we have a match
                next();
            } else {
                res.status(403).send("This route can only be used by servers.")
            }
            break;

        default: // unautenticated, let it go
            next();
    }
}