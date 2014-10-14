var mysql   = require('mysql');
var config 	= require('../config/config');

var workerFarm = require('worker-farm')
var companyPageScrapper 	= workerFarm(require.resolve('../kompass2/scrap-company-page'));
var activityUrlUpdate 		= workerFarm(require.resolve('../queries/update-scraping-status'));

var db = mysql.createConnection({
	host     : config.db.host,
	user     : config.db.user,
	password : config.db.password,
	port 	 : config.db.port,
	database : config.db.database
});

module.exports = function(callback) {
	var query = db.query('SELECT url FROM companyUrls WHERE scrapped IS NULL');
	query.on('error', function(err) { console.log('QUERY ERROR ' + JSON.stringify(err)); });
    query.on('result', function(result) {
    	activityPageScrapper(result.url, function(err) {
    		console.log('SCRAPE COMP ' + result.url + ' : ' + JSON.stringify(err));
    	});
    	activityUrlUpdate('companyUrls', result.url, function(err, activityUrl) {
    		console.log('UPDATE COMP ' + result.url + ' : ' + JSON.stringify(err));
    	});
	});
    query.on('end', function() { console.log('fini !!'); });
};