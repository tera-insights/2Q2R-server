/// <reference path="../typings/index.d.ts" />

/**
 * This file contains key manipulation routes
 */

import * as express from 'express';

export function getKeys(req: express.Request, res: express.Response) {


    // TODO: find the key 

}

export function deleteKey(req: express.Request, res: express.Response) {


    // TODO: find the key 

}


/* DELETE: /keys/:keyID/device
 * Requires digitally signed request from device. Useful for 2Q2R apps to 
 * self unregister.
*/
export function deleteDevKey(req: express.Request, res: express.Response) {
    // Check the digital signature

    // TODO: find the key 

}