/// <reference path="../typings/index.d.ts" />
/// <reference path="../interfaces/IKeys.ts" />
/// <reference path="../interfaces/u2f.d.ts" />

import * as Sequelize from 'sequelize';
import * as Promise from "bluebird";
import * as u2f from "u2f";

import * as IKeys from '../interfaces/IKeys';


function makeErrorPromise(msg: string) {
    return new Promise((resolve, reject) => {
        reject({ errorMsg: msg });
    })
}

/**
 * This class implements the schema for Keys. It provides all the 
 * manipulation needed to store and retrieve key info 
 * 
 * The class implements the digital signature verification interface as well
 * 
 * @export
 * @class KeysSchema
 */
export class KeysSchema {
    private schema: IKeys.IKeyModel;

    /**
     * Generate authentication or registration requests 
     * 
     * @param {string} appID
     * @param {string} keyID
     * @param {boolean} [register]
     * @returns
     */
    generateRequest(appID: string, keyID: string, register?: boolean) {
        if (register) {
            // just generate the request
            return new Promise((resolve) => {
                resolve(u2f.request(appID, keyID));
            });
        } else {
            return this.schema.findByPrimary(keyID).then(
                (key: IKeys.IKeyInstance) => {
                    if (!key)
                        throw "Key not found";

                    return u2f.request(appID, keyID);

/*
                    return key.updateAttributes("counter",
                        key.counter ? key.counter + 1 : 0)
                        .then(() => {
                            return u2f.request(appID, keyID);
                        });
*/              }

            );
        }
    }

    /**
     * Registration of a new key 
     * 
     * @param {string} userid The user associated with the key
     * @param {string} type "2q2r" and "u2f" only supported
     * @param {string} fcmToken The Firebase devide token
     * @param {u2f.IRequest} request Previously generated register request
     * @param {u2f.IRegisterData} registerData Registration data from device
     * @returns
     */
    register(userid: string, name: string, type: string, fcmToken: string,
        request: u2f.IRequest, registerData: u2f.IRegisterData) {
        // first check the registration
        var clientData = new Buffer(registerData.clientData).toString('base64');
        var res = u2f.checkRegistration(request, {
            clientData: clientData,
            registrationData: registerData.registrationData
        });
        if (res.successful) {
            return this.schema.create({
                keyID: res.keyHandle,
                userID: userid,
                type: type,
                pubKey: res.publicKey,
                name: name,
                counter: 0,
                fcmToken: fcmToken
            });
        } else {
            return makeErrorPromise(res.errorMessage);
        }
    }

    /**
     * Method to check an authentication reply. Mast match perfectly with an 
     * authentication request 
     * 
     * @param {u2f.IRequest} request
     * @param {u2f.ISignatureData} signature
     */
    checkSignature(request: u2f.IRequest, signature: u2f.ISignatureData) {
        // change client data to match what u2f expects
        var clientData = new Buffer(signature.clientData).toString('base64');
        return this.schema.findByPrimary(request.keyHandle).then(
            (key: IKeys.IKeyInstance) => {
                var res = u2f.checkSignature(request, {
                    clientData: clientData,
                    signatureData: signature.signatureData
                }, key.pubKey);
                if (res.successful) {
                    if (true || res.counter === key.counter) {
                        return "Authentication approved";
                    } else {
                        throw Error("Counter in signature does not match.");
                    }
                } else {
                    throw Error("Digital signature check failed.");
                }
            }
        );
    }


    /**
     * Only a small part of key info can be updated 
     * 
     * @param {string} id
     * @param {string} name
     * @param {string} fcmToken
     */
    update(id: string, name: string, fcmToken: string) {
        // figure out what to update
        var fields = [];
        if (name) fields.push("name");
        if (fcmToken) fields.push("fcmToken");

        return this.schema.update({
            keyID: id,
            name: name,
            fcmToken: fcmToken,
            userID: null,
            type: null,
            pubKey: null,
            counter: null
        }, {
                where: { keyID: id },
                fields: fields
            });
    }

    /**
     * Delete a specifig key
     * 
     * @param {string} userid
     * @param {string} id
     * @returns {Promise<number>}
     */
    delete(id: string) {
        return this.schema.destroy({
            where: { keyID: id }
        });
    }

    /**
     * Get all keys of a given user 
     * 
     * @param {string} userid
     * @returns {Promise<ITodo[]>}
     */
    get(userid: string) {
        return this.schema.findAll({
            where: { userID: userid }
        });
    }

    /**
     * Check wheter the user has any keys, i.e. it exists 
     * 
     * @param {string} userid
     * @returns Promise<boolean>
     */
    userExists(userid: string) {
        return this.schema.count({
            where: { userID: userid }
        }).then((cnt: number) => {
            return cnt > 0;
        });
    }


    /**
     * Delete user keys given the userid 
     * 
     * @param {string} userid
     * @returns
     */
    deleteUser(userid: string) {
        return this.schema.destroy({
            where: { userID: userid }
        });
    }

    constructor(private db: Sequelize.Connection) {
        this.schema = db.define<IKeys.IKeyInstance, IKeys.IKey>("Key", {
            userID: {
                type: Sequelize.STRING(128),
                allowNull: false
            },
            keyID: {
                type: Sequelize.STRING(64),
                allowNull: false,
                primaryKey: true
            },
            type: {
                type: Sequelize.STRING(6),
                allowNull: false
            },
            pubKey: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            name: {
                type: Sequelize.STRING(128),
                allowNull: false
            },
            counter: {
                type: Sequelize.INTEGER,
                autoIncrement: true
            },
            fcmToken: {
                type: Sequelize.STRING(128),
                allowNull: true
            }
        }, {
                tableName: "keys"
            });
    }
}
