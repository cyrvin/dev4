var express = require("express");
var logfmt 	= require("logfmt");
var request = require('request');
var cheerio = require('cheerio');
var pg 		= require('pg');
var async	= require('async');

var DATABASE_URL = 'postgresql://cyrillevincey@localhost/cyrillevincey'
var databaseUrl = process.env.DATABASE_URL || DATABASE_URL;
var nbEntriesPerPage = 80;
var nbRowsPerIteration = 10;
var maxQueueConcurrency = 5;
var app = express();

app.use(logfmt.requestLogger());
var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
	console.log("Listening on " + port);
});

/*------------------- FICHIER INDEX ------------------*/

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	res.render('index.html');
});

/*------------------- SCRAPING ROUTES ------------------*/

app.get('/step1-fetch-nomenclature-from-highest-level/', function(req, res) {
	getNomenclatureGeneral('http://fr.kompass.com/showNomenclature/');
});

app.get('/step2-fetch-activities-from-nomenclature/', function(req, res) {
	selectAndProcessUnscrapedRowsByN('nomenclature', 'nomenclatureUrl', getActivityFromNomenclaturePage);
});

app.get('/step3-fetch-companies-from-activity/', function(req, res) {
	iterateOnActivityPages();
});

app.get('/step4-scrape-company-page/', function(req, res) {
	iterateOnCompanyPages();
});

/*------------------- GET ACTIVIVITES FROM NOMENCLATURE PAGE ------------------*/
function getNomenclatureGeneral(nomenclatureUrl) {
	request(nomenclatureUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content > div > div > ul.categorie > li.span6 > a').each(function() {
			insertSingleValue('Nomenclature', 'nomenclatureUrl', 'http://fr.kompass.com' + $(this).attr('href'));
		});
	});
}

function getActivityFromNomenclaturePage(nomenclatureUrl) {
	request(nomenclatureUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content > div > div > div > div.tab-content.pull-right > div.tab-pane > ul > li > a').each(function() {
			insertDoubleValues('Activities', 'activityUrl', $(this).attr('href'), 'label', $(this).text());
		});
	});
}

function iterateOnCompanyPages() {
	var q = async.queue(function (companyUrl, updateItemAsScraped) {
		console.log("Scraping company " + companyUrl);
		scrapeCompanyPage2(companyUrl, updateItemAsScraped);
	}, maxQueueConcurrency);

	q.drain = function() {
		console.log('All Company pages have been scraped');
	}

	pg.connect(databaseUrl, function(err, client, done) {
		client.query('SELECT companyUrl FROM companies WHERE scraped = false', function(err, result) {
			done();
			if (err) return console.error(err);

			result.rows.forEach(function(row) {
				var companyUrl = row[field.toLowerCase()];
				console.log('Adding to queue ' + companyUrl);
				q.push(companyUrl);
			});
		});
	});
}

function iterateOnActivityPages() {
	var q = async.queue(scrapeCompaniesFromActivityPage, maxQueueConcurrency);

	q.drain = function() {
		console.log('All activity pages have been scraped');
	}

	pg.connect(databaseUrl, function(err, client, done) {
		client.query('SELECT activityUrl FROM activities WHERE activityUrl NOT IN (SELECT DISTINCT activityUrl FROM activityCompanies)', 
			function(err, result) {
			done();
			if (err) return console.error(err);

			result.rows.forEach(function(row) {
				var activityUrl = row['activityurl'];
				console.log('Adding to queue ' + activityUrl);
				q.push(activityUrl);
			});
		});
	});
}

/*------------------- GET COMPANIES FROM ACTIVITY PAGE ------------------*/
function scrapeCompaniesFromActivityPage(activityUrl, callback) {
	console.log('Scraping activity page : ' + activityUrl);

	request(activityUrl, function(error, response, html) {
		var $ = cheerio.load(html);

		$('#selectionForm > div > a').each(function() {
			insertDoubleValues('activityCompanies', 'activityUrl', activityUrl, 'companyUrl', $(this).attr('href'));
		});

		var resultCount = + $('#result-count > strong').text();
		var nbPages = parseInt(resultCount / nbEntriesPerPage);
		for (var i = 2 ; i <= nbPages ; i++) {
			scrapeCompaniesFromActivityPageNextPages(activityUrl, i);			
		}

		callback('activities', 'activityUrl', activityUrl);
	});
}

function scrapeCompaniesFromActivityPageNextPages(activityUrl, pageNumber) {
	var activityUrlWithPageNumber = activityUrl + 'page-' + pageNumber + '/';
	request(activityUrlWithPageNumber, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#selectionForm > div > a').each(function() {
			insertDoubleValues('activityCompanies', 'activityUrl', activityUrl, 'companyUrl', $(this).attr('href'));
		});
	});
}

/*------------------- GET ACTIVITIES FROM COMPANY PAGE ------------------*/
function scrapeCompanyPage(companyUrl) {
	request(companyUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		scrapeActivitiesFromCompanyPage($, '#mainActivitiesTree > ul > li > a', 'primary', companyUrl);
		scrapeActivitiesFromCompanyPage($, '#secondaryActivitiesTree > ul > li > a', 'secondary', companyUrl);
	});
}

function scrapeCompanyPage2(companyUrl, callback) {
	request(companyUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		scrapeActivitiesFromCompanyPage($, '#mainActivitiesTree > ul > li > a', 'primary', companyUrl);
		scrapeActivitiesFromCompanyPage($, '#secondaryActivitiesTree > ul > li > a', 'secondary', companyUrl);
		callback('companies', 'companyUrl', companyUrl);
	});
}

function scrapeActivitiesFromCompanyPage($, path, rank, companyUrl) {
	$(path).each(function() {
		var parentActivity = processActivity($(this), rank, null, companyUrl, insertCompanyActivity);
		$(this).parent().find('ul').find('li').find('a').each(function() {
			var childActivity = processActivity($(this), rank, parentActivity.url, companyUrl, insertCompanyActivity);
		});
	});
}

function processActivity(dollarThis, rank, parentUrl, companyUrl, callback) {
	var activity = {};

	activity.rank = rank;
	activity.url = dollarThis.attr('href');
	activity.parentUrl = parentUrl;

	var label = dollarThis.text();

	var roleAndLabel = parseRoleAndLabel(label);
	activity.label = roleAndLabel.label;
	activity.role = roleAndLabel.role;

	callback(activity, companyUrl);

	return activity;
}

function parseRoleAndLabel(label) {
	var roleAndLabel = {};

	if (label.lastIndexOf('(P)') > 0) {
		roleAndLabel.role = 'P';
		roleAndLabel.label = label.substring(0, (label.lastIndexOf('(P)') - 1));
	} else if (label.lastIndexOf('(D)') > 0) {
		roleAndLabel.role = 'D';
		roleAndLabel.label = label.substring(0, (label.lastIndexOf('(D)') - 1));
	} else if (label.lastIndexOf('(S)') > 0) {
		roleAndLabel.role = 'S';
		roleAndLabel.label = label.substring(0, (label.lastIndexOf('(S)') - 1));
	} else {
		roleAndLabel.role = null;
		roleAndLabel.label = label;
	}

	return roleAndLabel;
}

/*------------------- WRITE FUNCTIONS ------------------*/
function insertCompanyActivity(activity, companyUrl) {
	pg.connect(databaseUrl, function(err, client, done) {
		client.query(
			'INSERT into CompanyActivities (companyUrl, rank, activityUrl, role, parentUrl) VALUES($1, $2, $3, $4, $5)', 
			[companyUrl, activity.rank, activity.url, activity.role, activity.parentUrl], 
			function(err, result) {
				done();
				if (err) return console.log(err);
				console.log('Company activity inserted for ' + activity.url);
			});        
	});
}

function insertSingleValue(table, field, value) {
	pg.connect(databaseUrl, function(err, client, done) {
		client.query(
			'INSERT into ' + table + ' (' + field + ') VALUES($1)', 
			[value], 
			function(err, result) {
				done();
				if (err) return console.error(err);				
				console.log('Row inserted ' + value);
			});        
	});
}

function insertDoubleValues(table, field1, value1, field2, value2) {
	pg.connect(databaseUrl, function(err, client, done) {
		client.query(
			'INSERT into ' + table + ' (' + field1 + ', ' + field2 + ') VALUES($1, $2)', 
			[value1, value2], 
			function(err, result) {
				done();
				if (err) 	return console.error(err);				
				console.log('Row inserted ' + value1 + ' - ' + value2);
			});        
	});
}

function updateItemAsScraped(table, field, itemId) {
	pg.connect(databaseUrl, function(err, client, done) {
		client.query('UPDATE ' + table  + ' SET scraped = true WHERE ' + field + ' = $1', 
			[itemId],
			function(err, result) {
				done();
				if (err) return console.error(err);
				console.log('row marked as scraped: ', itemId);
			});
	});	
}

function insertSingleValueIfNotExist(table, field, value) {
	pg.connect(databaseUrl, function(err, client, done) {
		client.query('SELECT * FROM ' + table + ' WHERE ' + field + ' = $1', 
			[value],
			function(err, result) {
				done();
				if (err) 					return console.error(err);
				if (result.rowCount > 0) 	return console.log("Already here (no insert): ", value);
				
				insertSingleValue(table, field, value);
			});
	});
}

