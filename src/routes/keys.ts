/// <reference path="../typings/index.d.ts" />

/**
 * This file contains key manipulation routes
 */

import * as express from 'express';
import * as config from 'config';

import {Keys, Apps} from '../models';
import * as util from '../util';

interface IRequest extends util.IRequest {
    userID: string,
    appID: string,
}

// Set of pending requests
var pending = new util.PendingRequests();

// cache the Firebase Communicator key
var fbServerKey = config.get("fbServerKey");

// POST: /v1/key/request
export function request(req: express.Request, res: express.Response) {
    var userID = req.params.userID;
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
        deleteUrl: info.baseURL + "/keys/delete/" + id,
        waitUrl: info.baseURL + "/v1/keys/" + id + "/wait",
    });
}

// GET: /v1/key/:id/wait
export function wait(req: express.Request, res: express.Response) {
    var id = req.params.id;
    pending.waitByID(id)
        .then(() => {
            res.status(200).send("OK");
        }, (error) => {
            res.status(400).send(error);
        });
}

// GET: /key/:id
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
                name: "Delete",
                id: "delete",
                data: {
                    id: id,
                    keys: keys,
                    userID: cReq.userID,
                    appId: cReq.appID,
                    waitUrl: info.baseURL + "/v1/auth/" + id + "/wait",
                    deleteUrl: info.baseURL + "/v1/key/" +id + "/remove"
                }
            });

        });
}


export function getKeys(req: express.Request, res: express.Response) {
    var userID = req.params.userID;
    var appID = req.params.appID;
    Keys.get(appID, userID).then(
        (keys) => {
            res.json(keys);
        }, (err: Error) => {
            res.send(401).send(err.message);
        }
    );
}

export function deleteKey(req: express.Request, res: express.Response) {
    var keyID = req.params.keyID;
    var appID = req.body.appID;
    Keys.delete(appID, keyID).then(
        () => {
            res.status(200).send("Key " + keyID + " deleted.");
        }, (err: Error) => {
            res.status(400).send(err.message);
        }
    )

}


/* DELETE: /keys/:keyID/device
 * Requires digitally signed request from device. Useful for 2Q2R apps to 
 * self unregister.
*/
export function deleteDevKey(req: express.Request, res: express.Response) {
    // TODO
    res.status(501).send("Not yet implemented.");
}