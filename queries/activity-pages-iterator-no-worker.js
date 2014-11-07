var mysql   	= require('mysql');
var request 	= require('request');
var cheerio 	= require('cheerio');
var config 		= require('../config/config');
//var fs 			= require('fs');

var rds = mysql.createConnection({
	host     : config.rds.host,
	user     : config.rds.user,
	password : config.rds.password,
	port 	 : config.rds.port,
	database : config.rds.database
});

var localDb = mysql.createConnection({
	host     : config.local_db.host,
	user     : config.local_db.user,
	password : config.local_db.password,
	port 	 : config.local_db.port,
	database : config.local_db.database
});

var ActivityPageScrapper = function(){};

ActivityPageScrapper.prototype.batchActivities = function() {
	// var query = db.query('SELECT url FROM activityUrls'
	// 	+ ' WHERE scrapped IS NULL'
	// 	+ ' AND url NOT IN (SELECT activityUrl FROM companyUrls)'
	// 	+ ' ORDER BY url DESC'
	// 	+ ' LIMIT 100');
	var query = localDb.query('SELECT url FROM activityUrlsWithRegions WHERE scrapped IS NULL LIMIT 2000');
	query.on('error', function(err) { console.log('QUERY ERROR : ' + JSON.stringify(err))});
    query.on('result', function(result) {
		activityPageScrapper(result.url, function(err) {
			console.log('scrape : ' + result.url);
		});
		activityUrlUpdate('activityUrlsWithRegions', result.url, function(err, item) {});	    		
	});
    //query.on('end', function() { console.log('!!!!!!!!!!!!! BATCH FINI !!!!!!!!!!!!!'); });
};

module.exports = ActivityPageScrapper;

function activityPageScrapper(activityUrl, callback) {
	// var fileName = './data/' + activityUrl.split(':').join('').split('/').join('').split('-').join('').split('.').join('').slice(17) + '.txt';
	// var streamFile = fs.createWriteStream(fileName);
	var streamFile;

	request(activityUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content .row .prod_list a').each(function() {
			if ($(this) !== undefined) {
				checkThenInsertCompanyUrl($(this).attr('href'));
				//console.log('write: ' + $(this).attr('href'));				
			}
		});

		$('#result-count > strong').each(function() {
			if ($(this) !== undefined) {
				nbResultat = parseInt($(this).text());
				if (nbResultat <= config.kompass.nbEntriesPerPage) return;

				nbPages = Math.min(Math.ceil(nbResultat / config.kompass.nbEntriesPerPage), 5); //Paging limité à 5 pages sur le search

				for (var i = 2 ; i <= nbPages ; i++) {
					activityPageNext(activityUrl, activityUrl + 'page-' + i + '/', streamFile);
				}				
			}
		});		
	});
	callback(null, activityUrl);
}

function activityPageNext(activityRootUrl, activityUrl) {
	request(activityUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content .row .prod_list a').each(function() {
			if ($(this) !== undefined) {
				checkThenInsertCompanyUrl($(this).attr('href'));
				//console.log('write: ' + $(this).attr('href'));				
			}
		});
	});
}

/*--------------------------- SQL FUNCTIONS ---------------------------*/

function insertCompanyUrl(companyUrl) {
	var value = {url: companyUrl};
	localDb.query('INSERT IGNORE INTO companyUrls SET ? ', value, function(err, result) {});
}

function checkThenInsertCompanyUrl(companyUrl) {
	localDb.query('SELECT 1 FROM companyUrls WHERE url = ? LIMIT 1', [companyUrl], function(err, results) {
		if (results.length > 0) return;

		console.log('insert NEW companyUrl ' + companyUrl);
		var value = {url: companyUrl};
		localDb.query('INSERT IGNORE INTO companyUrls SET ? ', value, function(err, result) {});
	})
}

function activityUrlUpdate(tableName, url, callback) {
	localDb.query('UPDATE ' + tableName + ' SET scrapped = 1 WHERE url = ?', [url], function(err, result) {});
}