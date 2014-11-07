var request = require('request');
var cheerio = require('cheerio');
var mysql   = require('mysql');
var config 	= require('../config/config');

var db = mysql.createConnection({
	host     : config.local_db.host,
	user     : config.local_db.user,
	password : config.local_db.password,
	port 	 : config.local_db.port,
	database : config.local_db.database
});

var CompanyPageScraper = function(){};

CompanyPageScraper.prototype.batchActivities = function() {
	var query = db.query('SELECT url FROM companyUrls'
		+ ' WHERE url NOT IN (SELECT url FROM companyPresentation)'
		+ ' AND scrapped IS NULL'
//		+ ' ORDER BY url DESC'
		+ ' LIMIT 1000');
	query.on('error', function(err) { console.log('QUERY ERROR : ' + JSON.stringify(err))});
    query.on('result', function(result) {
		scrapeCompanyPage(result.url);
		db.query('UPDATE companyUrls SET scrapped = 1 WHERE url = ?', [result.url], function(err, result) {});
	});
    query.on('end', function() {});
};

 var scrapeCompanyPage = function(companyUrl) {
	var error = null;

	request(companyUrl, function(error, response, html) {
		var $ = cheerio.load(html);

		//Address
		var i = 1;
		$('#productDetailUpdateable .productDescription > p').each(function() {
			var value = {
				url: companyUrl, 
				line: i++,
				address: $(this).text().trim()
			};
			db.query('INSERT IGNORE INTO companyAddress SET ? ', value, function(err, result) {});
		});

		//Telephone
		$('#productDetailUpdateable #phone').each(function() {
			var value = {
				url: companyUrl,
				tel: $(this).text().trim()
			};
			db.query('INSERT IGNORE INTO companyTel SET ? ', value, function(err, result) {});
		});

		//Presentation
		$('#content #tab-details .editorHtml p').each(function() {
			var value = {
				url: companyUrl,
				presentation: $(this).text().replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim()
			};
			db.query('INSERT IGNORE INTO companyPresentation SET ? ', value, function(err, result) {});
			console.log('write company details for ' + companyUrl);
		});

		//Informations generales
		$('#content #tab-details .global p').each(function() {
			var typeInfo = $(this).children('strong').text().replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim();
			var valueInfo = $(this).children('span').text().replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim();
			if (valueInfo == undefined) valueInfo = $(this).children('span').attr('value').replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim();
			var value = {
				url: companyUrl,
				infoType: typeInfo,
				infoValue: valueInfo
			};
			db.query('INSERT IGNORE INTO companyInformation SET ? ', value, function(err, result) {});
		});

		//Chiffres-clefs : effectifs et CA
		$('#tab-keynumbers .effectif-bloc').each(function() {
			var value = {
				url: companyUrl,
				infoType: $(this).children('header').text().trim(),
				infoValue: $(this).children('.number').text().trim()
			};
			db.query('INSERT IGNORE INTO companyInformation SET ? ', value, function(err, result) {});
		});

		//Main Activities - Niveau 1
		$('#tab-activities #mainActivitiesTree ul > li > a').each(function() {
			var value = {
				url: companyUrl,
				activity: $(this).attr('id').trim(),
				rank: 'P',
				role: parseRole($(this).children('ins').text().trim())
			};
			db.query('INSERT IGNORE INTO companyActivities SET ? ', value, function(err, result) {});
		});

		//Main Activities - Niveau 2
		$('#tab-activities #mainActivitiesTree ul > li > ul > li > a').each(function() {
			var value = {
				url: companyUrl,
				activity: $(this).attr('id').trim(),
				rank: 'P',
				role: parseRole($(this).children('ins').text().trim())
			};
			db.query('INSERT IGNORE INTO companyActivities SET ? ', value, function(err, result) {});
		});

		//Secondary Activities - Niveau 1
		$('#tab-activities #secondaryActivitiesTree ul > li > a').each(function() {
			var value = {
				url: companyUrl,
				activity: $(this).attr('id').trim(),
				rank: 'S',
				role: parseRole($(this).children('ins').text().trim())
			};
			db.query('INSERT IGNORE INTO companyActivities SET ? ', value, function(err, result) {});
		});

		//Secondary Activities - Niveau 2
		$('#tab-activities #secondaryActivitiesTree ul > li > ul > li > a').each(function() {
			var value = {
				url: companyUrl,
				activity: $(this).attr('id').trim(),
				rank: 'S',
				role: parseRole($(this).children('ins').text().trim())
			};
			db.query('INSERT IGNORE INTO companyActivities SET ? ', value, function(err, result) {});
		});

		//NAF
		$('#tab-activities .activities.extra > p').each(function() {
			var value = {
				url: companyUrl,
				infoType: $(this).children('strong').text().trim(),
				infoValue: $(this).children('span').text().trim()
			};
			db.query('INSERT IGNORE INTO companyInformation SET ? ', value, function(err, result) {});
		});

		//Dirigeants et collaborateurs
		$('#tab-dirigeants .bloc').each(function() {
			var value = {
				url: companyUrl,
				firstName: $(this).children('.name').children('.firstName').text().trim(),
				lastName: $(this).children('.name').children('.lastName').text().trim(),
				role: $(this).children('.fonction').text().trim()
			};
			db.query('INSERT IGNORE INTO companyContacts SET ? ', value, function(err, result) {});
		});
	});
}

module.exports = CompanyPageScraper;

/*------------------- Internal functions ----------------------------*/

function parseRole(label) {
	if (label.lastIndexOf('(P)') > 0) 	return 'P';
	if (label.lastIndexOf('(D)') > 0) 	return 'D';
	if (label.lastIndexOf('(S)') > 0) 	return 'S';
	return '';
}