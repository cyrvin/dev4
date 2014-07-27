var express = require("express");
var logfmt 	= require("logfmt");
var request = require('request');
var cheerio = require('cheerio');
var pg 		= require('pg');

var DATABASE_URL = 'postgresql://cyrillevincey@localhost/cyrillevincey'
var databaseUrl = process.env.DATABASE_URL || DATABASE_URL;

var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
	getActivitiesFromCompanyPage('http://fr.kompass.com/c/alfa-concept-mecanique/fr8536783/');
});

var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
	console.log("Listening on " + port);
});

function getActivitiesFromCompanyPage(companyUrl) {
	request(companyUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		scrapeActivities($, '#mainActivitiesTree > ul > li > a', 'primary', companyUrl);
		scrapeActivities($, '#secondaryActivitiesTree > ul > li > a', 'secondary', companyUrl);
	});
};

function scrapeActivities($, path, rank, companyUrl) {
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

function writeCompanyActivity(activity, companyUrl) {
	pg.connect(databaseUrl, function(err, client, done) {
		client.query(
			'INSERT into CompanyActivities (companyUrl, rank, activityUrl, label, role, parentUrl) VALUES($1, $2, $3, $4, $5, $6)', 
			[companyUrl, activity.rank, activity.url, activity.label, activity.role, activity.parentUrl], 
			function(err, result) {
				if (err) {
					console.log(err);}
				else {
					console.log('row inserted for ' + activity.url);}
				done();
			});        
	});
}