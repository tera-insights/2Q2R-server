/// <reference path="../typings/index.d.ts" />
/// <reference path="../interfaces/IKeys.ts" />

import * as Sequelize from 'sequelize';
import * as config from 'config';

import { KeysSchema } from './Keys';
import { AppInfoMap, AppsSchema } from './Apps';

var configDB: any = config.get("database");

var sequelize = new Sequelize(configDB.db, configDB.username, 
    configDB.password, configDB.options);

// Export classes and instances of used schemas
export { KeysSchema } from './Keys';
export var Keys = new KeysSchema(sequelize);

export var Apps = new AppsSchema(<AppInfoMap>config.get("apps"));