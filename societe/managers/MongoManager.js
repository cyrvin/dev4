var Q = require('q');
var url = require('../config/global.js').db.mongo;

function MongoManager() {
    if (MongoManager.caller != MongoManager.getInstance) {
        throw new Error("This object cannot be instanciated");
    }
    this.mongoose = require('mongoose');
};

MongoManager.prototype.init = function(params) {
    var deferred = Q.defer();
    var self = this;

    var opts = {
        server: {
            auto_reconnect: true
        }
    };

    this.mongoose.connect(url, opts);

    var reconnTimer = null;
    var db = this.mongoose.connection;

    function tryReconnect() {
        reconnTimer = null;
        try {
            self.mongoose.connect(url);
            db = self.mongoose.connection;
        } catch (exception) {
            console.log('Cannot Close connection');
        }
    };

    db.on('error', function() {
        console.log('Connection to mongodb  :' + color.red('failed'), ' mongodb URL :', color.red(url));
    });

    db.on('open', function callback() {
        console.log('Connection to mongodb : OK', url);
        deferred.resolve();
    });

    db.on('opening', function() {
        console.log("reconnecting... %d", mongoose.connection.readyState);
    });

    db.on('close', function() {
        console.log("disconnected");
        self.mongoose.connection.readyState = 0;
        self.mongoose.connection.db.close();
        if (reconnTimer) {
            console.log("already trying");
        } else {
            reconnTimer = setTimeout(tryReconnect, 10);
        }
    });

    this.mongoose.reconnect = tryReconnect;

    return deferred.promise;
};

MongoManager.instance = null;

MongoManager.getInstance = function() {
    if (this.instance === null) {
        this.instance = new MongoManager();
    }
    return this.instance;
};

module.exports = MongoManager.getInstance();