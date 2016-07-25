/// <reference path="../typings/index.d.ts" />

import * as mongoose from 'mongoose';
import IKey = require('../interfaces/IKeys.ts');



var Schema = mongoose.Schema;

var KeySchema = new Schema({
    userID: String,
    keyID: String,
    type: String,
    pubKey: String,
    name: String,
    counter: { type: Number, default: 0 },
    fcmToken: String
});

export = mongoose.model<IKey>('Keys', KeySchema);