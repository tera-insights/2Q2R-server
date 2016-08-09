/// <reference path="../typings/index.d.ts" />
/// <reference path="../interfaces/u2f.d.ts" />

import * as express from 'express';

import {Keys} from '../models';
import * as config from 'config';

/**
 * This file contains all the routes that deal with registration of devices.
 */

interface IRequest extends u2f.IRequest {
    userID: string,
    time: Date,
    status?: number, // the status of delayed reply
    message?: string, // the message for delayed reply  
    request: express.Response
}

enum Reply {
    KeyExists,
    SaveKeyErr,
    RegistrationOK,
    DigitalSigErr
}

/**
 * Auxiliary function to help correctly replying to both the server and the registering device.
 */
function replyBoth(reply: Reply, res: express.Response, req: IRequest) {
    var status = 500; // default status
    var msg = "Unknown error.";

    switch (reply) {
        case Reply.KeyExists:
            status = 409; msg = "The userID,keyID combination already exists."; break;

        case Reply.SaveKeyErr:
            status = 400; msg = "Could not save the new key info"; break;

        case Reply.DigitalSigErr:
            status = 401; msg = "Digital signature incorrect"; break;

        case Reply.RegistrationOK:
            status = 200; msg = "Registration successful."; break;
    }

    // now deal with the message transmission
    if (req.request) { // request pending, send to both
        res.send(status).send(msg);
        req.request.send(status).send(msg);
        // challenge completed (positively or negatively)
        delete pending[req.challenge];
    } else {
        // cache server reply to send latter but sent this request
        req.status = status;
        req.message = msg;
    }
}

// Set of pending requests
var pending: { [challenge: string]: IRequest } = {};

// POST: /register
export function register(req: express.Request, res: express.Response) {
    var data = JSON.parse(req.body.clientData);

    // make sure we have this challenge pending
    var cReq = pending[data.challenge];
    if (!cReq) { // No valid challenge pending 
        res.status(403).send("Challenge does not exist");
        return;
    }

    Keys.register(data.userID, req.body.name, req.body.type, req.body.fcmToken,
        cReq, <u2f.IRegisterData>req.body).then(
        (msg: string) => {
            replyBoth(Reply.RegistrationOK, res, cReq);
        }, (err: Error) => {
            replyBoth(Reply.SaveKeyErr, res, cReq);
        });

}

// POST: /register/server
export function server(req: express.Request, res: express.Response) {
    var challenge = req.body.challenge;
    var userID = req.body.userID;

    var cReq = pending[challenge];
    if (!cReq || cReq.userID != userID) { // No valid challenge pending 
        res.status(401).send("Request invalid");
        return;
    }

    if (!cReq.request) {
        // fullfil this rightaway and remove the pending challenge
        res.status(cReq.status).send(cReq.message);
        delete pending[challenge];
    } else {
        // que up this request
        cReq.request = res;
    }
}

// POST: /register/challenge
export function challenge(req: express.Request, res: express.Response) {
    var userID = req.body.userID;
    var appID = req.body.appID;

    Keys.generateRequest(appID, null, true)
        .then((req: IRequest) => {
            req.userID = userID;
            req.time = new Date();
            pending[req.challenge] = req;

            res.send(JSON.stringify({
                infoURL: config.get('baseUrl') + "/info",
                challenge: req.challenge,
                appID: appID
            }));
        });
}
