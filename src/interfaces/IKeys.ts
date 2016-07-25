/// <reference path="../typings/index.d.ts" />

import * as mongoose from 'mongoose';

interface IKey extends mongoose.Document {
    /**
     * The abstract user ID. This can be anything, possibly an email on 
     * a randomly generated base64 or hex string.
     */
    userID: string;

    /**
     * Base64 256 bit key ID. It is very important that these key IDs are
     * randomly generated or come from physical devices.
     */
    keyID: string;

    /**
     * The key type. Supported types are "u2f" and "2q2r" for now. 
     * This info is only interesting for the frontend and does not change
     * backend behavior. 
     */
    type: string; 

    /**
     * This is a EC P-256 public key in the U2F format, i.e. base64 encoded 
     * 65 byte represencation of the key where the first byte is 0x40.
     */ 
    pubKey: string;

    /**
     * Displayable name of the key. Usually the device name to be able to tell
     * various user keys apart.
     */
    name: string;

    /**
     * Counter used to protect against replay attacks. The user will be forced
     * to sign digital messages with increasing counts.
     */
    counter: number; 

    /**
     * This is the Firebase device token used to send push notifications.
     * Makes sense only for 2Q2R devices, i.e. phones.
     * 
     * Note: if a fcmToken is present the Firebase push notification is send
     * irrespective of the key type.
     */
    fcmToken: string;

}

export = IKey;