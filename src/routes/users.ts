/// <reference path="../typings/index.d.ts" />

/**
 * This file contains user manipulation routes
 */

import * as express from 'express';
import {Keys} from '../models';

/*  DELETE: /users/:userID
 *  Delete all user info including keys.
*/
export function deleteUser(req: express.Request, res: express.Response) {
    var userID = req.params.userID;
    var appID = req.params.appID;

    Keys.deleteUser(appID, userID).then(
        () => {
            res.status(200).send("User "+userID+" deleted.");
        }, (err:Error) => {
            res.send(401).send(err.message);
        }
    );
}

// POST: /users/exists/:userID
export function existsUser(req: express.Request, res: express.Response) {
    var userID = <string>req.body.userID;
    var appID = req.body.appID;

    Keys.userExists(appID, userID).then(
        (exists:boolean) => {
            console.log("Exists:", exists);
            res.json({exists: exists});
        }, (error) => {
            console.log("Error: ", error);
            res.status(401).send(error.message);
        }
    )

}