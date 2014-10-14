var mysql   = require('mysql');
var config 	= require('../config/config');

var db = mysql.createConnection({
	host     : config.db.host,
	user     : config.db.user,
	password : config.db.password,
	port 	 : config.db.port,
	database : config.db.database
});

module.exports = function(tableName, url, callback) {
	db.query('UPDATE ' + tableName + ' SET scrapped = 1 WHERE url = ?', [url], function(err, result) {
		callback(err, result);
	});
};