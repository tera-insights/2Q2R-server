module.exports = {
    "port": process.env.PORT || 3030,
    "sessionCookie": {
        "maxAge": 8640000,
        "httpOnly": true,
        "secure": false
    },
    "sessionSecret": process.env.SESSION_SECRET || "TestTest",
    "sessionKey": 'sessionId',
    "sessionCollection": 'sessions',
    // 2Q2R cohnfig options
    "appID": "761842o37647823648172",
    "apiKey": "274849238748293482"
};
