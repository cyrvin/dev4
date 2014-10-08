var mysql      = require('mysql');

var db = mysql.createConnection({
	host     : process.env.RDS_HOSTNAME,
	user     : process.env.RDS_USERNAME,
	password : process.env.RDS_PASSWORD,
	port 	 : process.env.RDS_PORT
});

var DatabaseConnection = function(){};

DatabaseConnection.prototype.writeCompanyUrl = function(companyUrl) {
	var value = {url: companyUrl};
	db.query('INSERT IGNORE INTO companyUrls SET ? ', value, function(err, result) {
		if (err) {
			console.log('writeCompanyUrl -> ERROR ON URL ' + companyUrl + ' : ' + err.stack); 
	 		return;
		}
		console.log('writeCompanyUrl -> OK on ' + companyUrl);
	});
	// db.connect(function(err) {
	// 	if (err) {
	// 		console.log('writeCompanyUrl -> ERROR ON URL ' + companyUrl + ' : ' + err.stack); 
	// 		return;
	// 	}
	// 	var value = {url: companyUrl};
	// 	db.query('INSERT IGNORE INTO companyUrls SET ? ', value, function(err, result) {
	// 		console.log('writeCompanyUrl -> OK on ' + companyUrl);
	// 	});
	// });
}

module.exports = DatabaseConnection;