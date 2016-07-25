/// <reference path="../typings/index.d.ts" />

/**
 * This file contains all the routes that deal with registration of devices.
 */

import * as express from 'express';

// u2f has no d.ts definition
var u2f = require('u2f');

// Local config file.
var config = require('../config.js');

import Key = require('../models/Keys');
import IKey = require('../interfaces/IKeys');

interface IRequest {
    userID: string,
    challenge: string,
    apiId: string,
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

    var registerData = {
        clientData: new Buffer(req.body.clientData).toString('base64'),
        registrationData: req.body.registrationData
    };
    var checkRes = u2f.checkRegistration(cReq, registerData);

    if (checkRes.successful) {
        var keyID = checkRes.keyHandle;

        // check that we do not already have the same userID, keyID combination
        Key.findOne({
            userID: data.userID,
            keyID: keyID
        }, (key: IKey) => {
            if (key) {
                replyBoth(Reply.KeyExists, res, cReq);
            } else {
                // new combination, save it
                var newKey = new Key({
                    userID: data.userID,
                    keyID: keyID,
                    type: data.type,
                    pubKey: checkRes.pubKey,
                    name: data.deviceName,
                    counter: 0,
                    fcmToken: data.fcmToken
                }).save((err) => {
                    if (err)
                        replyBoth(Reply.SaveKeyErr, res, cReq);
                    else {
                        replyBoth(Reply.RegistrationOK, res, cReq);
                    }
                });
            }
        });
    } else {
        replyBoth(Reply.DigitalSigErr, res, cReq);
    }

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

    pending[u2fReq.challenge] = u2fReq;

    res.send(JSON.stringify({
        infoURL: config.baseUrl + "/info",
        challenge: u2fReq.challenge,
        appID: appID
    }));
}
