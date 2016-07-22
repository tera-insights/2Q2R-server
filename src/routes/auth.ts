/// <reference path="../typings/index.d.ts" />

import * as crypto from 'crypto';
// u2f has no d.ts definition
var u2f = require('u2f');

// Local config file.
var config = require('../config.js');

/**
 * This file contains all the routes that deal with authentication of devices.
 */

import * as express from 'express';

interface IRequest {
    userID: string,
    challenge: string,
    appId: string,
    keyHandle: string,
    time: Date,
    authenticated: boolean,
    request: express.Response
}

// Set of pending requests
var pending: { [challenge: string]: IRequest } = {};

// POST: /auth
export function authtenticate(req: express.Request, res: express.Response) {
    var clientData:any = {};
    try {
        clientData = JSON.parse(req.body.clientData);
    } catch(e){
        res.status(404).send("Invalid request");
    }

    var cReq = pending[clientData.challenge];
    if (!cReq || cReq.userID != clientData.userID || cReq.keyHandle != clientData.keyID) { // No valid challenge pending 
        res.status(401).send("Request invalid");
        return;
    }

    var u2fRes = {
        clientData: new Buffer(req.body.clientData).toString('base64'),
        signatureData: req.body.signatureData
    };

    // TODO: find the key info data from DB
/*
    var pubKey = registrations[userID][challenges[userID].keyHandle].pubKey;
    var checkSig = u2f.checkSignature(challenges[userID], u2fRes, pubKey);

    if (checkSig.successful) {

        challenges[userID].onCompletion.status(200).send({ successful: true });

        // open user session
        res.status(200).send("Authentication approved!");

    } else {

        challenges[userID].onCompletion.status(400).send();

        console.log("Authentication for \"" + userID + "\" failed.");
        res.status(400).send("Authentication failed.");

    }
    
*/
    if (cReq.request) { // have a pending requests
        cReq.request.status(200).send("Authentication successful.");
        delete pending[clientData.challenge];
    } else {
        cReq.authenticated = true
    }


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

    if (cReq.authenticated) {
        // fullfil this rightaway and remove the pending challenge
        delete pending[challenge];
        res.send("Succesful");
    } else {
        // que up this request
        cReq.request = res;
    }
}

// POST: /auth/challenge
export function challenge(req: express.Request, res: express.Response) {
    var userID = req.body.userID;
    var keyID = req.body.keyID;
    var apiKey = req.body.apiKey;
    var appID = req.body.appID;

    if (apiKey != config.apiKey || appID != config.appID) {
        res.status(401).send("Incorrect authentication");
        return;
    }

    // TODO: check tha we have this user/key combination

    /// create the challenge and the pending request
    var u2fReq = <IRequest>u2f.request(config.appID, keyID);
    u2fReq.userID = userID;
    u2fReq.time = new Date();
    u2fReq.authenticated = false;

    pending[u2fReq.challenge] = u2fReq;

    res.send(JSON.stringify({
        infoURL: config.baseUrl + "/info",
        challenge: u2fReq.challenge,
        appID: appID,
        keyID: keyID
    }));
}
