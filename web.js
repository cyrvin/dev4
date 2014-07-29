var express = require("express");
var logfmt 	= require("logfmt");
var request = require('request');
var cheerio = require('cheerio');
var pg 		= require('pg');

var DATABASE_URL = 'postgresql://cyrillevincey@localhost/cyrillevincey'
var databaseUrl = process.env.DATABASE_URL || DATABASE_URL;
var nbEntriesPerPage = 80;

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

/*------------------- ROUTES ------------------*/

app.get('/companypage/', function(req, res) {
	getActivitiesFromCompanyPage('http://fr.kompass.com/c/alfa-concept-mecanique/fr8536783/');
});

app.get('/activitypage/', function(req, res) {
	getCompaniesFromActivityPage('http://fr.kompass.com/a/architectes-d-interieur/8410032/');
});

app.get('/nomenclature/', function(req, res) {
	getActivityFromNomenclaturePage('http://fr.kompass.com/n/energie-environnement/03/');
});

app.get('/step1-fetch-nomenclature-from-highest-level/', function(req, res) {
	getNomenclatureGeneral('http://fr.kompass.com/showNomenclature/');
});

app.get('/step2-fetch-activities-from-nomenclature/', function(req, res) {
	selectAndProcessUnscrapedRowsByN('nomenclature', 'nomenclatureUrl', 10, getActivityFromNomenclaturePage);
});

/*------------------- GET ACTIVIVITES FROM NOMENCLATURE PAGE ------------------*/
function getNomenclatureGeneral(nomenclatureUrl) {
	request(nomenclatureUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content > div > div > ul.categorie > li.span6 > a').each(function() {
			writeSingleValue('Nomenclature', 'nomenclatureUrl', 'http://fr.kompass.com' + $(this).attr('href'));
		});
	});
}

function getActivityFromNomenclaturePage(nomenclatureUrl) {
	request(nomenclatureUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content > div > div > div > div.tab-content.pull-right > div.tab-pane > ul > li > a').each(function() {
			writeDoubleValues('Activities', 'activityUrl', $(this).attr('href'), 'label', $(this).text());
		});
	});
}

/*------------------- GET COMPANIES FROM ACTIVITY PAGE ------------------*/
function getCompaniesFromActivityPage(activityUrl) {
	request(activityUrl, function(error, response, html) {
		var $ = cheerio.load(html);

		$('#selectionForm > div > a').each(function() {
			writeSingleValue('Companies', 'companyUrl', $(this).attr('href'));
		});

		var resultCount = + $('#result-count > strong').text();
		var nbPages = parseInt(resultCount / nbEntriesPerPage);
		for (i = 2 ; i <= nbPages ; i++) {
			getCompaniesFromActivityPageNextPages(activityUrl, i);			
		}

		updateItemAsScraped('activities', 'activityUrl', activityUrl);
	});
}

function getCompaniesFromActivityPageNextPages(activityUrl, pageNumber) {
	var activityUrlWithPageNumber = activityUrl + 'page-' + pageNumber + '/';
	request(activityUrlWithPageNumber, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#selectionForm > div > a').each(function() {
			writeSingleValue('Companies', 'companyUrl', $(this).attr('href'));
		});
	});
}

/*------------------- GET ACTIVITIES FROM COMPANY PAGE ------------------*/
function scrapeCompanyPage(companyUrl) {
	request(companyUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		scrapeActivities($, '#mainActivitiesTree > ul > li > a', 'primary', companyUrl);
		scrapeActivities($, '#secondaryActivitiesTree > ul > li > a', 'secondary', companyUrl);
	});
}

function scrapeActivitiesFromCompanyPage($, path, rank, companyUrl) {
	$(path).each(function() {
		var parentActivity = processActivity($(this), rank, null, companyUrl, writeCompanyActivity);
		$(this).parent().find('ul').find('li').find('a').each(function() {
			var childActivity = processActivity($(this), rank, parentActivity.url, companyUrl, writeCompanyActivity);
		});
	});
}

function processActivity(dollarThis, rank, parentUrl, companyUrl, writeCompanyActivity) {
	var activity = {};

	activity.rank = rank;
	activity.url = dollarThis.attr('href');
	activity.parentUrl = parentUrl;

	var label = dollarThis.text();

	var roleAndLabel = parseRoleAndLabel(label);
	activity.label = roleAndLabel.label;
	activity.role = roleAndLabel.role;

	writeCompanyActivity(activity, companyUrl);

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
function writeCompanyActivity(activity, companyUrl) {
	pg.connect(databaseUrl, function(err, client, done) {
		client.query(
			'INSERT into CompanyActivities (companyUrl, rank, activityUrl, label, role, parentUrl) VALUES($1, $2, $3, $4, $5, $6)', 
			[companyUrl, activity.rank, activity.url, activity.label, activity.role, activity.parentUrl], 
			function(err, result) {
				if (err) return console.log(err);
				console.log('row inserted for ' + activity.url);

				done();
			});        
	});
}

function writeSingleValue(table, field, value) {
	pg.connect(databaseUrl, function(err, client, done) {
		client.query(
			'INSERT into ' + table + ' (' + field + ') VALUES($1)', 
			[value], 
			function(err, result) {
				done();
				if (err) return console.error(err);				
				console.log('row inserted ' + value);
			});        
	});
}

function writeDoubleValues(table, field1, value1, field2, value2) {
	pg.connect(databaseUrl, function(err, client, done) {
		client.query(
			'INSERT into ' + table + ' (' + field1 + ', ' + field2 + ') VALUES($1, $2)', 
			[value1, value2], 
			function(err, result) {
				done();
				if (err) 	return console.error(err);				
				console.log('row inserted ' + value1 + ' - ' + value2);
			});        
	});
}

function selectAndProcessUnscrapedRowsByN(table, field, nbRows, callback) {
	pg.connect(databaseUrl, function(err, client, done) {
		client.query('SELECT ' + field + ' FROM ' + table + ' WHERE scraped = false LIMIT ' + nbRows, function(err, result) {
			done();
			if (err) return console.error(err);
			console.log('DEBUG: ', result.rows);

			result.rows.forEach(function(row) {
				callback(row[field.toLowerCase()]);
			});
		});
	});
}

function updateItemAsScraped(table, field, itemId) {
	pg.connect(databaseUrl, function(err, client, done) {
		client.query('UPDATE ' + table  + ' SET scraped = true WHERE ' + field + ' = ' + itemId, function(err, result) {
			done();
			if (err) return console.error(err);
			console.log('row marked as scraped: ', itemId);
		});
	});	
}

