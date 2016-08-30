/// <reference path="../typings/index.d.ts" />

/**
 * This file contains key manipulation routes
 */

import * as express from 'express';
import {Keys} from '../models';

export function getKeys(req: express.Request, res: express.Response) {
    var userID = req.params.userID;
    var appID = req.params.appID;
    Keys.get(appID, userID).then(
        (keys) => {
            res.json(keys);
        }, (err:Error) => {
            res.send(401).send(err.message);
        }
    );
}

export function deleteKey(req: express.Request, res: express.Response) {
    var keyID = req.params.keyID;
    var appID = req.params.appID;
    Keys.delete(appID, keyID).then(
        () => {
            res.status(200).send("Key "+keyID+" deleted.");
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