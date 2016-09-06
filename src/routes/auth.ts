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
    counter?: number,
    fcmToken?: string,
}

// Set of pending requests
var pending = new util.PendingRequests();

// cache the Firebase Communicator key
var fbServerKey = config.get("fbServerKey");

// POST: /auth
export function authtenticate(req: express.Request, res: express.Response) {
    if (req.body.errorStatus) {
        // we got an error. Resolve accordingly
        var cReq = <IRequest>pending.getByChallenge(req.body.challenge);
        if (cReq && req.body.errorMessage) {
            pending.reject(cReq, req.body.errorStatus, req.body.errorMessage);
            res.status(200).send("Authentication canceled");
            return;
        } else {
            res.status(400).send("Incorrect message");
        }
    }

    var data: any = {};
    try {
        data = JSON.parse(req.body.clientData);
    } catch (e) {
        res.status(404).send("Invalid request");
        return;
    }

    var cReq = <IRequest>pending.getByChallenge(data.challenge);

    if (!cReq /*|| cReq.userID != clientData.userID 
     || cReq.keyHandle != clientData.keyID*/) { // No valid challenge pending 
        res.status(403).send("Challenge does not exist");
        return;
    }

    //TODO: add appID in request
    var appID = data.appID ? data.appID : cReq.appId;

    if (cReq.appId != appID) { // appIDs do not match, big problem
        console.log(cReq, data);
        res.status(402).send("The appID in initial request and device reply do not match.");
        return;
    }

    console.log("Start login:", data, cReq);

    Keys.checkSignature(cReq, <u2f.ISignatureData>req.body, cReq.counter)
        .then((msg: string) => {
            console.log("Authentication resolving:", msg);
            pending.resolve(cReq, msg);
            res.status(200).send("OK");
        }, (err: Error) => {
            console.log("Error:", err);
            pending.reject(cReq, 400, err.message);
            res.status(400).send("Authentication failed");
        });
}

// GET: /auth/:id/wait
export function wait(req: express.Request, res: express.Response) {
    var id = req.params.id;
    pending.waitByID(id)
        .then(() => {
            res.status(200).send("OK");
        }, (error) => {
            res.status(400).send(error);
        });
}

// POST: /v1/auth/:id/select
export function challenge(req: express.Request, res: express.Response) {
    var keyID = req.body.keyID;
    var id = req.params.id;

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

            console.log("Request:", req);
            pending.replace(id, req);

            // send a Firebase request if we can
            if (req.fcmToken) {
                console.log("Sending Firebase request");
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
                        console.log("Firebase request: ", response.statusCode, response.body);
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
    var userID = req.body.userID;
    var appID = req.body.appID;

    if (!userID || !appID) {
        res.status(400).send("Missing parameters.");
    }

    var info = Apps.getInfo(appID);

    var rep: IRequest = {
        userID: userID,
        appID: appID
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
            console.log("Keys of ", cReq.appID, cReq.userID, keys);
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
                    infoUrl: info.baseURL + "/v1/info/" + cReq.appId,
                    waitUrl: info.baseURL + "/v1/auth/" + id + "/wait",
                    challengeUrl: info.baseURL + "/v1/auth/" + id + "/challenge",
                }
            });

        });
}

