/// <reference path="../typings/index.d.ts" />
/// <reference path="../interfaces/u2f.d.ts" />

import * as express from 'express';
var unirest = require('unirest');

import {Keys, Apps} from '../models';
import * as config from 'config';
import * as u2f from "u2f";

import * as util from '../util';

/**
 * This file contains all the routes that deal with authentication of devices.
 */

interface IRequest extends u2f.IRequest, util.IRequest {
    userID: string,
    appID: string,
    nonce: string,
    counter?: number,
    fcmToken?: string,
}

// Set of pending requests
var pending = new util.PendingRequests();

// cache the Firebase Communicator key
var fbServerKey = config.get("fbServerKey");

// POST: /auth
export function authenticate(req: express.Request, res: express.Response) {
    var payload = req.body.data;
    var successful = req.body.successful;
    var challenge = "";
    var data: any;

    if (successful) {
        data = JSON.parse(new Buffer(payload.clientData, 'base64').toString('utf8'));
        challenge = data.challenge
    } else {
        challenge = payload.challenge;
    }

    // make sure we have this challenge pending
    var cReq = <IRequest>pending.getByChallenge(challenge);
    if (!cReq) { // No valid challenge pending 
        res.status(403).send("Challenge does not exist");
        return;
    }

    // Device not happy, send to everybody
    if (!successful) {
        pending.reject(cReq, payload.errorStatus, payload.errorMessage);
        res.status(200).send("Authentication canceled");
        return;
    }

    //TODO: add appID in request
    var appID = data.appID ? data.appID : cReq.appId;

    if (cReq.appId != appID) { // appIDs do not match, big problem
        console.log(cReq, data);
        res.status(402).send("The appID in initial request and device reply do not match.");
        return;
    }

    cReq.appId = cReq.appUrl; // This is clearly a hack.

    Keys.checkSignature(cReq, <u2f.ISignatureData>payload, cReq.counter)
        .then((msg: string) => {
            pending.resolve(cReq, {msg: msg, nonce: cReq.nonce});
            res.status(200).send("OK");
        }, (err: Error) => {
            pending.reject(cReq, 400, err.message);
            res.status(400).send("Authentication failed");
        });
}

// GET /auth/:id/wait
// POST /auth/wait (requestID: the request id)
export function wait(req: express.Request, res: express.Response) {
    var id = req.body.requestID || req.params.id;
    console.log("ID:", id);
    pending.waitByID(id)
        .then((rep) => {
            res.status(200).send("OK");
        }, (error) => {
            res.status(400).send(error);
        });
}

// POST: /v1/auth/:id/select
export function challenge(req: express.Request, res: express.Response) {
    var keyID = req.body.keyID;
    var id = req.body.requestID || req.params.id;

    // look up the request
    var cReq = <IRequest>pending.getByID(id);

    if (!cReq) {
        res.status(403).send("Request does not exist");
        return;
    }

    Keys.generateRequest(cReq.appID, keyID, false)
        .then((req: IRequest) => {
            req.userID = cReq.userID;
            req.appID = cReq.appID;
            req.appUrl = cReq.appUrl;

            pending.replace(id, req);

            // send a Firebase request if we can
            if (req.fcmToken) {
                unirest.post("https://fcm.googleapis.com/fcm/send")
                    .headers({
                        "Authorization": "key=" + fbServerKey,
                        "Content-Type": "application/json"
                    })
                    .send({
                        to: req.fcmToken,
                        data: {
                            authData: "A " + req.appId + " " + req.challenge + " " +
                            keyID + " " + req.counter
                        }
                    })
                    .end(function (response) {
                        //console.log("Firebase request: ", response.statusCode, response.body);
                    });
            }

            res.json({
                keyID: keyID,
                challenge: req.challenge,
                counter: req.counter,
                appID: cReq.appID
            })
        }, (err) => {
            res.status(400).send(err);
        });
}

// POST: /auth/request
export function request(req: express.Request, res: express.Response) {
    var userID = req.params.userID;
    var appID = req.body.appID;
    var nonce = req.params.nonce;

    if (!userID || !appID) {
        res.status(400).send("Missing parameters.");
    }

    var info = Apps.getInfo(appID);

    var rep: IRequest = {
        userID: userID,
        appID: appID,
        appUrl: info.appURL,
        nonce: nonce
    };

    var id = pending.add(rep);

    res.json({
        id: id,
        authUrl: info.baseURL + "/auth/" + id,
        waitUrl: info.baseURL + "/v1/auth/" + id + "/wait",
    });
}


export function iframe(req: express.Request, res: express.Response) {
    var id = req.params.id;
    var cReq = <IRequest>pending.getByID(id);
    var info = Apps.getInfo(cReq.appID);

    if (!cReq || !info) {
        res.status(401).send("Unauthorized");
        return;
    }

    Keys.get(cReq.appID, cReq.userID)
        .then((keys) => {
            res.render('all', {
                layout: false,
                name: "Authentication",
                id: "auth",
                data: {
                    id: id,
                    counter: cReq.counter,
                    keys: keys,
                    challenge: cReq.challenge,
                    userID: cReq.userID,
                    appId: cReq.appId,
                    appUrl: info.appURL,
                    authUrl: info.baseURL + "/v1/auth",
                    infoUrl: info.baseURL + "/v1/info/" + cReq.appId,
                    waitUrl: info.baseURL + "/v1/auth/" + id + "/wait",
                    challengeUrl: info.baseURL + "/v1/auth/" + id + "/challenge",
                }
            });

        });
}

