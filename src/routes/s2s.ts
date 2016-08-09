/// <reference path="../typings/index.d.ts" />

/**
 * This file provides a method to ensure the requests are server-to-server
 * authenicated requests. 
 */

import * as express from 'express';
import * as config from 'config';

var serverAuth = config.get("serverAuth");
var tokens = config.get("authTokens");

export function ensureServer(req: express.Request, res: express.Response, next: Function) {
    switch (serverAuth) {
        case "token":
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