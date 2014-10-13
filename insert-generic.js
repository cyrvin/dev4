var mysql   = require('mysql');

var db = mysql.createConnection({
	host     : '127.0.0.1',
	user     : 'root',
	port 	 : '3306',
	database : 'kompass'
});

module.exports = function(tableName, value, callback) {
	db.query('INSERT IGNORE INTO ' + tableName + ' SET ? ', value, function(err, result) {
		if (err) 	callback(err, 	tableName + JSON.stringify(value))
		else 		callback(null, 	tableName + JSON.stringify(value));
	});
};