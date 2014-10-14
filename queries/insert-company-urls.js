var mysql   = require('mysql');
var config 	= require('../config/config');

var db = mysql.createConnection({
	host     : config.db.host,
	user     : config.db.user,
	password : config.db.password,
	port 	 : config.db.port,
	database : config.db.database
});

module.exports = function(companyUrl, activityUrl, callback) {
	var value = {
		url: companyUrl,
		activityUrl: activityUrl
	};
	db.query('INSERT IGNORE INTO companyUrls SET ? ', value, function(err, result) {
		if (err) 	callback(err, companyUrl)
		else 		callback(null, companyUrl);
	});
};