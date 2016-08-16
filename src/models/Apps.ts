/// <reference path="../typings/index.d.ts" />

import * as config from 'config';

export interface AppInfo {
    name: string;
    authType: "token" | "DSA";
    token?: string;
    pubKey?: string;
}

export type AppInfoMap = { [appID: string]: AppInfo };


/**
 * Returns the IP address of the server.
 */
function findIPv4() {
    var os = require('os');
    var ni = os.networkInterfaces();

    for (var int in ni) {
        if ((<any>int).startsWith("lo"))
            continue;

        var networks = ni[int];

        for (var i = 0; i < networks.length; i++) {
            var network = networks[i];

            if(!network.address.startsWith("127") && network.family == "IPv4") {
                return network.address;
            }
        }
    }

    console.log("No network found.");
    throw Error("No network found.");
}


/**
 * This class provides information about apps supported by this 
 * server. 
 * 
 * @export
 * @class AppsSchema
 */

export class AppsSchema {
    // app info from config
    private apps: AppInfoMap;
    private baseURL: string;

    /**
     * Check authentication of an object 
     * 
     * @param {*} obj
     * @returns {boolean} True if authentication succeds, false otherwise
     */
    checkAuth(obj: any): boolean {
        if (!obj.appID) return false; // missing appID

        var app = this.apps[obj.appID];

        if (!app) return false; // no matching appID

        switch (app.authType) {
            case "token":
                if (!obj.token || obj.token !== app.token)
                    return false; // no or unmatched token
                return true;

            default:
                return false; // authentication not supported
        }
    }

    getInfo(appID: string): any {
        var app = this.apps[appID];
        if (!app) return undefined;
        else
            return {
                appName: app.name,
                baseURL:  this.baseURL, 
                appID: appID
        }
    }

    constructor(apps: AppInfoMap) {
        this.apps = apps; 
        var baseURL = <string> config.get("baseURL");
        var port = <string> config.get("port");
        var IP = findIPv4();
        this.baseURL = baseURL
            .replace('%port', port)
            .replace('%IP', IP);
        console.log("Server BaseURL:", this.baseURL);
    }

}