var request 	= require('request');
var cheerio 	= require('cheerio');
var config 	= require('../config/config');

// var workerFarm 	= require('worker-farm')
// var insertCompanyUrlWorkers  = workerFarm(require.resolve('../queries/insert-company-urls'));

var mysql   = require('mysql');
var config 	= require('../config/config');

var db = mysql.createConnection({
	host     : config.db.host,
	user     : config.db.user,
	password : config.db.password,
	port 	 : config.db.port,
	database : config.db.database
});

/*--------------------------- KompassActivity class ---------------------------*/

module.exports = function(activityUrl, callback) {
	console.log('SCRAPE ACTV ' + activityUrl);

	request(activityUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content .row .prod_list a').each(function() {
			// insertCompanyUrlWorkers($(this).attr('href'), activityUrl, function(err, companyUrl){
			// 	if (err) 	console.log('ERROR - INS ' + err)
			// 	else 		console.log('INSERT COMP ' + companyUrl);
			// });
			insertCompanyUrl($(this).attr('href'), activityUrl, function(err, companyUrl){
				if (err) 	console.log('ERROR - INS ' + err)
				else 		console.log('INSERT COMP ' + companyUrl);
			});
		});

		$('#result-count > strong').each(function() {
			nbResultat = parseInt($(this).text());
			if (nbResultat <= config.kompass.nbEntriesPerPage) return;

			nbPages = Math.min(Math.ceil(nbResultat / config.kompass.nbEntriesPerPage), 5); //Paging limité à 5 pages sur le search

			for (var i = 2 ; i <= nbPages ; i++) {
				activityPageNext(activityUrl, activityUrl + 'page-' + i + '/');
			}
		});
	});
	callback(null, activityUrl);
}

/*--------------------------- Internal functions ---------------------------*/

function activityPageNext(activityRootUrl, activityUrl) {
	request(activityUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content .row .prod_list a').each(function() {
			// insertCompanyUrlWorkers($(this).attr('href'), activityUrl, function(err, companyUrl){
			// 	if (err) 	console.log('ERROR - INS ' + err)
			// 	else 		console.log('INSERT COMP ' + companyUrl);
			// });
			insertCompanyUrl($(this).attr('href'), activityUrl, function(err, companyUrl){
				if (err) 	console.log('ERROR - INS ' + err)
				else 		console.log('INSERT COMP ' + companyUrl);
			});

		});
	});
}

function insertCompanyUrl(companyUrl, activityUrl, callback) {
	var value = {
		url: companyUrl,
		activityUrl: activityUrl
	};
	db.query('INSERT IGNORE INTO companyUrls SET ? ', value, function(err, result) {
		if (err) 	callback(err, companyUrl)
		else 		callback(null, companyUrl);
	});
};