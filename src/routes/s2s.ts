/// <reference path="../typings/index.d.ts" />

/**
 * This file provides a method to ensure the requests are server-to-server
 * authenicated requests. 
 */

import * as express from 'express';
import * as config from 'config';

import { Apps } from '../models';

export function ensureServer(req: express.Request, res: express.Response, next: Function) {
    if (Apps.checkAuth(req.body))
        next();
    else
        res.status(403).send("This route can only be used by servers.");
}