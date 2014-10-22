var mysql   	= require('mysql');
var request 	= require('request');
var cheerio 	= require('cheerio');
var config 		= require('../config/config');
var fs 			= require('fs');

var db = mysql.createConnection({
	host     : config.db.host,
	user     : config.db.user,
	password : config.db.password,
	port 	 : config.db.port,
	database : config.db.database
});

var ActivityPageScrapper = function(){};

ActivityPageScrapper.prototype.batchActivities = function() {
	var query = db.query('SELECT url FROM activityUrls'
		+ ' WHERE scrapped IS NULL'
		+ ' AND url NOT IN (SELECT activityUrl FROM companyUrls)'
		+ ' ORDER BY url DESC'
		+ ' LIMIT 100');
	query.on('error', function(err) { console.log('QUERY ERROR : ' + JSON.stringify(err))});
    query.on('result', function(result) {
		activityPageScrapper(result.url, function(err) {
			console.log('SCRAPE PAGE ' + result.url + ' : ' + JSON.stringify(err));
		});
		activityUrlUpdate('activityUrls', result.url, function(err, item) {
			console.log('UPDATE ACTV ' + item + ' : ' + JSON.stringify(err));
		});	    		
	});
    query.on('end', function() { console.log('!!!!!!!!!!!!! BATCH FINI !!!!!!!!!!!!!'); });
};

module.exports = ActivityPageScrapper;

function activityPageScrapper(activityUrl, callback) {
	console.log('SCRAPE ACTV ' + activityUrl);

	var fileName = './data/' + activityUrl.split(':').join('').split('/').join('').split('-').join('').split('.').join('') + '.txt';
	var streamFile = fs.createWriteStream(fileName);

	request(activityUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content .row .prod_list a').each(function() {
			// insertCompanyUrl($(this).attr('href'), activityUrl, function(err, companyUrl){
			streamFile.write($(this).attr('href') + '\n');
			console.log('write: ' + $(this).attr('href'));
		});

		$('#result-count > strong').each(function() {
			nbResultat = parseInt($(this).text());
			if (nbResultat <= config.kompass.nbEntriesPerPage) return;

			nbPages = Math.min(Math.ceil(nbResultat / config.kompass.nbEntriesPerPage), 5); //Paging limité à 5 pages sur le search

			for (var i = 2 ; i <= nbPages ; i++) {
				activityPageNext(activityUrl, activityUrl + 'page-' + i + '/', streamFile);
			}
		});
	});
	callback(null, activityUrl);
}

function activityPageNext(activityRootUrl, activityUrl, streamFile) {
	request(activityUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content .row .prod_list a').each(function() {
			// insertCompanyUrl($(this).attr('href'), activityUrl, function(err, companyUrl){
			streamFile.write($(this).attr('href') + '\n');
			console.log('write: ' + $(this).attr('href'));
		});
	});
}

/*--------------------------- SQL FUNCTIONS ---------------------------*/

function insertCompanyUrl(companyUrl, activityUrl, callback) {
	var value = {
		url: companyUrl,
		activityUrl: activityUrl
	};
	db.query('INSERT IGNORE INTO companyUrls SET ? ', value, function(err, result) {
		if (err) 	callback(err, companyUrl)
		else 		callback(null, companyUrl);
	});
}

function activityUrlUpdate(tableName, url, callback) {
	db.query('UPDATE ' + tableName + ' SET scrapped = 1 WHERE url = ?', [url], function(err, result) {});
}