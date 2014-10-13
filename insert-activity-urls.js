var mysql   = require('mysql');

var db = mysql.createConnection({
	host     : '127.0.0.1',
	user     : 'root',
	port 	 : '3306',
	database : 'kompass'
});

module.exports = function(activityUrl, callback) {
	var value = {url: activityUrl};
	db.query('INSERT IGNORE INTO activityUrls SET ? ', value, function(err, result) {
		if (err) 	callback(err, activityUrl)
		else 		callback(null, activityUrl);
	});
};