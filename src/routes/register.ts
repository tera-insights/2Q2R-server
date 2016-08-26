/// <reference path="../typings/index.d.ts" />
/// <reference path="../util/requests.ts" />
/// <reference path="../interfaces/u2f.d.ts" />

import * as express from 'express';
import * as Promise from "bluebird";

import {Keys, Apps} from '../models';
import * as config from 'config';
import * as u2f from "u2f";

import * as util from '../util';

/**
 * This file contains all the routes that deal with registration of devices.
 */

interface IRequest extends u2f.IRequest, util.IRequest {
    userID: string;
}

var pending = new util.PendingRequests();

// the default appID for backwards compatibility
var defaultAppID = config.get("defaultAppID");

// GET: /info
export function info(req: express.Request, res: express.Response) {
    var appID = req.params.appID ? req.params.appID : defaultAppID;
    var info = Apps.getInfo(appID);
    res.json(info);
}

// POST: /register
/*
 * Device registration route. 
 */
export function register(req: express.Request, res: express.Response) {
    var data = JSON.parse(req.body.clientData);
    var appID = data.appID;

    // make sure we have this challenge pending
    var cReq = <IRequest>pending.getByChallenge(data.challenge);
    if (!cReq) { // No valid challenge pending 
        res.status(403).send("Challenge does not exist");
        return;
    }

    if (cReq.appId != appID) { // appIDs do not match, big problem
        res.status(402).send("The appID in initial request and device reply do not match.");
        return;
    }

    Keys.register(cReq.appId, cReq.userID, req.body.deviceName,
        req.body.type || "2q2r", req.body.fcmToken,
        cReq, <u2f.IRegisterData>req.body
    ).then(
        (msg: string) => {
            pending.resolve(cReq, msg);
        }, (err: Error) => {
            console.log("Error:", err);
            pending.reject(cReq, 400, err.message);
        });

}

// POST: /register/challenge
export function challenge(req: express.Request, res: express.Response) {
    var userID = req.body.userID;
    var appID = req.body.appID;

    Keys.generateRequest(appID, null, true)
        .then((req: IRequest) => {
            req.userID = userID;
            var id = pending.add(req);

            var reply: any = Apps.getInfo(appID);
            reply.challenge = req.challenge;
            reply.id = id;

            res.json(reply);
        });
}

// POST: /register/request
export function request(req: express.Request, res: express.Response) {
    var userID = req.body.userID;
    var appID = req.body.appID;

    Keys.generateRequest(appID, null, true)
        .then((req: IRequest) => {
            req.userID = userID;
            var id = pending.add(req);
            res.json({id: id});
        });
}

// GET: /register/:id
export function wait(req: express.Request, res: express.Response) {
    var id = req.params.id;
    pending.waitByID(id)
        .then( () => {
            res.status(200).send("OK");
        }, (error) => {
            res.status(400).send(error);
        });
}
