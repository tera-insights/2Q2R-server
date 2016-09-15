/// <reference path="../typings/index.d.ts" />

/**
 * This file provides a method to ensure the requests are server-to-server
 * authenicated requests. 
 */

import * as express from 'express';
import * as config from 'config';

import { Apps } from '../models';

export function ensureServer(req: express.Request, res: express.Response, next: Function) {
    if (req['s2s']) {
        req.body['appID'] = req['appID'];
        next();
    } else {
        if (req['s2s-fail']) {
            res.status(401).send(req['s2s-fail']);
        } else {
            res.status(403).send("This route can only be used by servers.");
        }
    }
}