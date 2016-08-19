/// <reference path="../typings/index.d.ts" />
/// <reference path="../interfaces/u2f.d.ts" />

import * as express from 'express';
var unirest = require('unirest');

import {Keys, Apps} from '../models';
import * as config from 'config';
import * as u2f from "u2f";

/**
 * This file contains all the routes that deal with authentication of devices.
 */

interface IRequest extends u2f.IRequest {
    userID: string,
    time: Date,
    keyHandle: string,
    counter: number,
    fcmToken?: string,
    // server reply state
    request: express.Response,
    status?: number,
    message?: string,
}

// Set of pending requests
var pending: { [challenge: string]: IRequest } = {};

// cache the Firebase Communicator key
var fbServerKey = config.get("fbServerKey");

// POST: /auth
export function authtenticate(req: express.Request, res: express.Response) {
    var clientData: any = {};
    try {
        clientData = JSON.parse(req.body.clientData);
    } catch (e) {
        res.status(404).send("Invalid request");
    }

    var cReq = pending[clientData.challenge];

    if (!cReq /*|| cReq.userID != clientData.userID 
     || cReq.keyHandle != clientData.keyID*/) { // No valid challenge pending 
        res.status(401).send("Request invalid");
        return;
    }

    Keys.checkSignature(cReq, <u2f.ISignatureData>req.body, cReq.counter)
        .then((msg: string) => {
            if (cReq.request) {
                cReq.request.status(200).send(msg);
                delete pending[clientData.challenge];
            } else {
                cReq.status = 200;
                cReq.message = msg;
            }
            res.status(200).send("Authentication successful.");
        }, (err: Error) => {
            if (cReq.request) {
                cReq.request.status(400).send(err.message);
                delete pending[clientData.challenge];
            } else {
                cReq.status = 400;
                cReq.message = err.message;
            }
            res.status(400).send("Authentication failed.");
            console.log("Authentication failed. ", err);
        });
}

// POST: /auth/server
export function server(req: express.Request, res: express.Response) {
    var challenge = req.body.challenge;
    var userID = req.body.userID;
    var keyID = req.body.keyID;

    var cReq = pending[challenge];
    if (!cReq || cReq.userID != userID || cReq.keyHandle != keyID) { // No valid challenge pending 
        res.status(401).send("Request invalid");
        return;
    }

    if (cReq.status) {
        // fullfil this rightaway and remove the pending challenge
        delete pending[challenge];
        res.status(cReq.status).send(cReq.message);
    } else {
        // que up this request
        cReq.request = res;
    }
}

// POST: /auth/challenge
export function challenge(req: express.Request, res: express.Response) {
    var userID = req.body.userID;
    var keyID = req.body.keyID;
    var appID = req.body.appID;

    Keys.generateRequest(appID, keyID, false)
        .then((req: IRequest) => {
            req.userID = userID;
            req.time = new Date();
            pending[req.challenge] = req;

            var reply: any = Apps.getInfo(appID);
            reply.challenge = req.challenge;
            reply.counter = req.counter;

            // send a Firebase request if we can
            if (req.fcmToken)
                unirest.post("https://fcm.googleapis.com/fcm/send")
                    .headers({
                        "Authorization": "key=" + fbServerKey,
                        "Content-Type": "application/json"
                    })
                    .send({
                        to: req.fcmToken,
                        data: {
                            authData: "A " + appID + " " + req.challenge + " " + 
                                keyID + " " + req.counter
                        }
                    })
                    .end(function (response) {
                        console.log("Firebase request: ", response.statusCode);
                    });

            res.json(reply);
        });
}
