var mysql   = require('mysql');
var config 	= require('../config/config');

var workerFarm = require('worker-farm')
var activityPageScrapper 	= workerFarm(require.resolve('../kompass2/scrap-activity-page'));
var activityUrlUpdate 		= workerFarm(require.resolve('../queries/update-scraping-status'));

var db = mysql.createConnection({
	host     : config.db.host,
	user     : config.db.user,
	password : config.db.password,
	port 	 : config.db.port,
	database : config.db.database
});

module.exports = function(callback) {
	var query = db.query('SELECT url FROM activityUrls WHERE scrapped is null ORDER BY url DESC');
	query.on('error', function(err) { console.log('QUERY ERROR'); });
    query.on('result', function(result) {
    	activityPageScrapper(result.url, function(err) {
    		console.log('SCRAPE PAGE ' + result.url + ' : ' + JSON.stringify(err));
    	});
    	activityUrlUpdate('activityUrls', result.url, function(err, activityUrl) {
    		console.log('UPDATE ACTV ' + result.url + ' : ' + JSON.stringify(err));
    	});
	});
    query.on('end', function() { console.log('fini !!'); });
};