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

// GET: /info
export function info(req: express.Request, res: express.Response) {
    var appID = req.params.appID;
    var info = Apps.getInfo(appID);
    if (info)
        res.json(info);
    else
        res.status(401).send("Application ID does not exist.");
}

// POST: /register
/*
 * Device registration route. 
 */
export function register(req: express.Request, res: express.Response) {
    // console.log("Registration: ", req.body);
    var data: any;

    if (req.body.clientData[0] == "{") { // phone TODO: change phone
        data = JSON.parse(req.body.clientData);
        req.body.clientData = new Buffer(req.body.clientData).toString('base64');
    } else {
        data = JSON.parse(new Buffer(req.body.clientData, 'base64').toString('utf8'));
        console.log("U2F Data:", data, req.body.clientData);
    }
    var appID = data.appID;

    // make sure we have this challenge pending
    var cReq = <IRequest>pending.getByChallenge(data.challenge);
    if (!cReq) { // No valid challenge pending 
        res.status(403).send("Challenge does not exist");
        return;
    }

    //TODO: add appID in request
    appID = appID ? appID : cReq.appId;

    if (cReq.appId != appID) { // appIDs do not match, big problem
        console.log(cReq, data);
        res.status(402).send("The appID in initial request and device reply do not match.");
        return;
    }

    console.log("Start register:", data, cReq, req.body.deviceName);

    if (req.body.type == "u2f")
        cReq.appId = data.origin; // This is clearly a hack.

    Keys.register(cReq.appId, cReq.userID, req.body.deviceName,
        req.body.type || "2q2r", req.body.fcmToken,
        cReq, <u2f.IRegisterData>req.body
    ).then(
        (msg: string) => {
            console.log("Register resolving:", msg);
            pending.resolve(cReq, msg);
            res.status(200).send("OK");
        }, (err: Error) => {
            console.log("Error:", err);
            pending.reject(cReq, 400, err.message);
            res.status(400).send("Registration failed");
        });

}

// POST: /register/request
export function request(req: express.Request, res: express.Response) {
    var userID = req.body.userID;
    var appID = req.body.appID;

    var info = Apps.getInfo(appID);

    Keys.generateRequest(appID, null, true)
        .then((req: IRequest) => {
            req.userID = userID;
            console.log("Request:", req);
            var id = pending.add(req);
            res.json({
                id: id,
                registerUrl: info.baseURL + "/register/" + id,
                waitUrl: info.baseURL + "/v1/register/" + id + "/wait",
            });
        });
}

// GET: /register/:id/wait
export function wait(req: express.Request, res: express.Response) {
    var id = req.params.id;
    pending.waitByID(id)
        .then(() => {
            res.status(200).send("OK");
        }, (error) => {
            res.status(400).send(error);
        });
}

export function iframe(req: express.Request, res: express.Response) {
    var id = req.params.id;
    var cReq = <IRequest>pending.getByID(id);

    if (!cReq) {
        res.status(404).send("The request expired or is invalid.");
        return;
    }

    var info = Apps.getInfo(cReq.appId);

    if (!cReq || !info) {
        res.status(401).send("Unauthorized");
        return;
    }

    res.render('all', {
        layout: false,
        name: "Registration",
        id: "register",
        data: {
            id: id,
            keyTypes: ["2q2r", "u2f"],
            challenge: cReq.challenge,
            userID: cReq.userID,
            appId: cReq.appId,
            baseUrl: info.baseURL,
            infoUrl: info.baseURL + "/v1/info/" + cReq.appId,
            registerUrl: info.baseURL + "/v1/register",
            waitUrl: info.baseURL + "/v1/register/" + id + "/wait"
        }
    });
}

