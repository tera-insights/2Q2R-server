/// <reference path="../typings/index.d.ts" />

import * as Promise from "bluebird";
import * as crypto from "crypto";

import * as config from 'config';

var deleteDelay = 5000; // delay in ms to delete requests once answer is obtained

export interface IRequest {
    challenge: string;
    id: string; 
    promise: Promise<any>; // promise that allows the answer to be picked up
    resolve: Function; // function to announce correct answer
    reject: Function; // Function to announce failure 
}

/**
 * Class that models pendign requests. It deals with correct 
 * dispatch of requests to all interested parties.
 * 
 * Requests must inherit from IAsyncRequest trait  
 * 
 * @export
 * @class PendingRequests
 */
export class PendingRequests {
    private pendingByChallenge: { [challenge: string]: IRequest } = {};
    private pendingByID: { [id: string]: IRequest } = {};

    /**
     * Send results to all listners so they can finis their requests 
     * 
     * @param {IRequest} request
     * @param {*} obj
     */
    resolve(request: IRequest, obj: any) {
        if (request.resolve)
            request.resolve(obj);
        else
            throw new Error("Could not correctly reply");
    }

    /**
     * Reject all pending requests with a given error status and message 
     * 
     * @param {IRequest} request
     * @param {number} status
     * @param {string} msg
     */
    reject(request: IRequest, status: number, msg: string) {
        if (request.reject)
            request.reject({
                status: status,
                message: msg
            });
        else
            throw new Error("Could not correctly reply");
    }

    delayedRemoveById(id: string) {
        var challenge = this.pendingByID[id].challenge;
        // delete after delay amount
        setTimeout(() => {
            delete this.pendingByChallenge[challenge];
            delete this.pendingByID[id];
        }, deleteDelay);
    }

    delayedRemoveByChallenge(challenge: string){
        var id = this.pendingByChallenge[challenge].id;
        this.delayedRemoveById(id);
    }

    getByID(id: string): IRequest {
        return this.pendingByID[id];
    }

    getByChallenge(challenge: string): IRequest {
        return this.pendingByChallenge[challenge];
    }

    waitByID(id: string) {
        if (this.pendingByID[id])
            return this.pendingByID[id].promise;
        else    
            return Promise.reject("ID not found");
    }

    /**
     * Add the request and return  
     * 
     * @param {IRequest} request
     * @returns the created request ID
     */
    add(request: IRequest): string {
        // generate 16 random bytes and convert to base64Web
        var id = crypto.randomBytes(16).toString('base64')
            .replace(/\//g, '_').replace(/\+/g, '-').replace(/\=/g, '');
        
        request.id = id;

        // setup the wait promise
        request.promise = new Promise( (resolve, reject) => {
            request.resolve = resolve;
            request.reject = reject;
        });

        this.pendingByChallenge[request.challenge] = request;
        this.pendingByID[id] = request;

        return id;
    }

    constructor() {
        // Nothing to do
    }
}





