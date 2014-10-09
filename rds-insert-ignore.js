var mysql      = require('mysql');

var db = mysql.createConnection({
	host     : process.env.RDS_HOSTNAME,
	user     : process.env.RDS_USERNAME,
	password : process.env.RDS_PASSWORD,
	port 	 : process.env.RDS_PORT,
	database : 'ebdb'
});

module.exports = function(fieldValue, callback) {
	var value = {url: fieldValue};
	db.query('INSERT IGNORE INTO companyUrls SET ? ', value, function(err, result) {
		if (err) 	callback(err, fieldValue)
	 	else 		callback(null, fieldValue);
	});
};