var express = require("express");
var logfmt 	= require("logfmt");
var request = require('request');
var cheerio = require('cheerio');
var pg 		= require('pg');

//var DATABASE_URL = 'postgres://xirltryzxcpdls:yRStNpzO4hmyAvJV5TOZ92mDqY@ec2-54-197-241-95.compute-1.amazonaws.com:5432/daqgo67bqvvbal';
//var databaseUrl = process.env.DATABASE_URL || DATABASE_URL;

var DATABASE_URL = 'postgresql://cyrillevincey@localhost/cyrillevincey'
var databaseUrl = DATABASE_URL;

var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
	getActivitiesFromCompanyPage('http://fr.kompass.com/c/schunk-intec-sarl/fr8394169/');
});

var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
	console.log("Listening on " + port);
});

//console.log($(this).text().replace(/\s+/g, " ").trim()); //ok
//console.log($(this).attr('href')); //ok
//console.log($(this).text()); //ok

function getActivitiesFromCompanyPage(companyUrl) {

	request(companyUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		scrapeActivities($, '#mainActivitiesTree > ul > li > a', 'primary', companyUrl);
		scrapeActivities($, '#secondaryActivitiesTree > ul > li > a', 'secondary', companyUrl);
	});
};

function scrapeActivities($, path, rank, companyUrl) {
	$(path).each(function() {
		var parentActivity = processActivity($(this), rank, null);
		writeCompanyActivity(parentActivity, companyUrl);
		$(this).parent().find('ul').find('li').find('a').each(function() {
			var childActivity = processActivity($(this), rank, parentActivity.url);
			writeCompanyActivity(childActivity, companyUrl);
		});
	});
}

function processActivity(dollarThis, rank, parentUrl) {
	var activity = {};

	activity.rank = rank;
	activity.url = dollarThis.attr('href');
	activity.parentUrl = parentUrl;

	var label = dollarThis.text();

	var roleAndLabel = parseRoleAndLabel(label);
	activity.label = roleAndLabel.label;
	activity.role = roleAndLabel.role;

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

function writeCompanyActivity(activity, companyUrl) {
	console.log('company : ', companyUrl);

	pg.connect(databaseUrl, function(err, client, done) {
		client.query(
			'INSERT into CompanyActivities (companyUrl, rank, activityUrl, label, role, parentUrl) VALUES($1, $2, $3, $4, $5, $6)', 
			[companyUrl, activity.rank, activity.url, activity.label, activity.role, activity.parentUrl], 
			function(err, result) {
				if (err) {
					console.log(err);
				} else {
					console.log('row inserted for ' + companyUrl + ' ' + activity.url);
				}
				client.end();
			});        
	});
}