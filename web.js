// web.js
var express = require("express");
var logfmt 	= require("logfmt");
var pg 		= require('pg');

var request = require('request');
var cheerio = require('cheerio');

var app = express();
var DATABASE_URL = 'postgres://vfqplevrmxaqlr:dgYZcJgTzSlnFXjmEzFIeBDCRe@ec2-54-204-36-244.compute-1.amazonaws.com:5432/d6in99hc89dtc3';

app.use(logfmt.requestLogger());

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	res.render('index.html');
});

console.log("Registering endpoint: /connection");
app.get('/connection/', function(req, res){
	var publicUrl = req.query.puburl;

	getSkillsFromPublicUrl(publicUrl, function(error, skills){
		console.log(skills);
		res.send(skills);
	});

});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
	console.log("Listening on " + port);
});

function isStoredInDatabase(publicUrl) {
	/*console.log('isStoredInDatabase - step 1');

	pg.connect(process.env.DATABASE_URL, function(err, client) {
		var query = client.query('SELECT publicUrl FROM CONNECTIONS WHERE publicUrl = ' + publicUrl);

		query.on('row', function(row) {
			console.log('row : ', row);
			return true;
		});
	});*/
	return false;
};

function getSkillsFromDatabase(publicUrl, callback) {
/*	var skills = [];
	pg.connect(process.env.DATABASE_URL, function(err, client) {
		var query = client.query('SELECT skill FROM CONNECTIONS WHERE publicUrl = ' + publicUrl);
		query.on('row', function(row) {
			skills.push(JSON.stringify(row));
		});
	});
*/	callback(true, undefined);
};

function getSkillsFromPublicUrl(publicUrl, callback) {

	getSkillsFromDatabase(publicUrl, function(error, skills)  {

		if(skills)
			callback(null, skills)
		else{
			var params = {publicUrl: publicUrl};
			getSkillsFromScrapping(params, callback);
		}
	});
};

function getSkillsFromScrapping(params, callback) {

	var url = params.publicUrl;

	request(url, function(error, response, html) {

		if (error) 
			callback(error);
		else {
			var $ = cheerio.load(html);
			var skills = [];
			$('#profile-skills .content .skills li .jellybean').each(function(i, skill) {
				skills.push($(this).text().replace(/\s+/g, " ").trim());				
			});
			callback(error,skills);
		}
	});
};


