var mysql   = require('mysql');
var config 	= require('../config/config');

var db = mysql.createConnection({
	host     : config.db.host,
	user     : config.db.user,
	password : config.db.password,
	port 	 : config.db.port,
	database : config.db.database
});

module.exports = function(tableName, value, callback) {
	var value = {url: activityUrl};
	db.query('INSERT IGNORE INTO ' + tableName + ' SET ? ', value, function(err, result) {
		if (err) 	callback(err, activityUrl)
		else 		callback(null, activityUrl);
	});
};