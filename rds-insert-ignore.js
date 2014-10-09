var mysql   = require('mysql');
// var fs 		= require('fs');

// var stream 	= fs.createWriteStream('./data/companies.txt');

// var db = mysql.createConnection({
// 	host     : process.env.RDS_HOSTNAME,
// 	user     : process.env.RDS_USERNAME,
// 	password : process.env.RDS_PASSWORD,
// 	port 	 : process.env.RDS_PORT,
// 	database : 'ebdb'
// });

var db = mysql.createConnection({
	host     : '127.0.0.1',
	user     : 'root',
	port 	 : '3306',
	database : 'kompass'
});

module.exports = function(fieldValue, callback) {
	// stream.write(fieldValue + '\n');
	// callback(null, fieldValue);

	var value = {url: fieldValue};
	db.query('INSERT IGNORE INTO companyUrls SET ? ', value, function(err, result) {
		if (err) 	callback(err, fieldValue)
		else 		callback(null, fieldValue);
	});
};