/// <reference path="../typings/index.d.ts" />

/**
 * This file contains all the routes that deal with registration of devices.
 */

import * as express from 'express';

// u2f has no d.ts definition
var u2f = require('u2f');

// Local config file.
var config = require('../config.js');


interface IRequest {
    userID: string,
    challenge: string,
    apiId: string,
    time: Date,
    completed: boolean,
    request: express.Response
}

// Set of pending requests
var pending: { [challenge: string]: IRequest } = {};

// POST: /register
export function register(req: express.Request, res: express.Response) {


}

// POST: /register
export function server(req: express.Request, res: express.Response) {
    var challenge = req.body.challenge;
    var userID = req.body.userID;

    var cReq = pending[challenge];
    if (!cReq || cReq.userID != userID) { // No valid challenge pending 
        res.status(401).send("Request invalid");
        return;
    }

    if (cReq.completed) {
        // fullfil this rightaway and remove the pending challenge
        delete pending[challenge];
        res.send("Succesful");
    } else {
        // que up this request
        cReq.request = res;
    }

}

// POST: /register/challenge
export function challenge(req: express.Request, res: express.Response) {
    var userID = req.body.userID;
    var apiKey = req.body.apiKey;
    var appID = req.body.appID;

    if (apiKey != config.apiKey || appID != config.appID) {
        res.status(401).send("Incorrect authentication");
        return;
    }

    // TODO: check tha we do not have this user/key combination

    /// create the challenge and the pending request
    var u2fReq = <IRequest>u2f.request(config.appID);
    u2fReq.userID = userID;
    u2fReq.time = new Date();
    u2fReq.completed = false;

    pending[u2fReq.challenge] = u2fReq;

    res.send(JSON.stringify({
        infoURL: config.baseUrl + "/info",
        challenge: u2fReq.challenge,
        appID: appID
    }));
}
