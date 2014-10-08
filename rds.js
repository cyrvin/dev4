var mysql      = require('mysql');

var db = mysql.createConnection({
	host     : process.env.RDS_HOSTNAME,
	user     : process.env.RDS_USERNAME,
	password : process.env.RDS_PASSWORD,
	port 	 : process.env.RDS_PORT
});

var DatabaseConnection = function(){};

DatabaseConnection.prototype.writeCompanyUrl = function(companyUrl) {
	db.connect(function(err) {
		if (err) {
			console.log('writeCompanyUrl -> ERROR ON URL ' + companyUrl + ' : ' + err.stack); 
			return;
		}
		var value = {url: companyUrl};
		db.query('INSERT IGNORE INTO companyUrls SET ? ', value, function(err, result) {
			console.log('writeCompanyUrl -> OK on ' + companyUrl);
		});
	});
}

DatabaseConnection.prototype.writeCompanyUrls = function(companyUrls) {
	db.connect(function(err) {
		if (err) {
			console.log('writeCompanyUrl -> ERROR ON URL ' + companyUrl + ' : ' + err.stack); 
			return;
		}
		var value = {url: companyUrl};
		db.query('INSERT IGNORE INTO companyUrls SET ? ', value, function(err, result) {
			console.log('writeCompanyUrl -> OK on ' + companyUrl);
		});
	});
}

module.exports = DatabaseConnection;