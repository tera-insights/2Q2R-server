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
    Keys.deleteUser(userID).then(
        () => {
            res.status(200).send("User "+userID+" deleted.");
        }, (err:Error) => {
            res.send(401).send(err.message);
        }
    );
}

