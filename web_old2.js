// web.js
var express = require("express");
var logfmt 	= require("logfmt");
var request = require('request');
var cheerio = require('cheerio');

var app = express();

//var pg 		= require('pg');
//var DATABASE_URL = 'postgres://xirltryzxcpdls:yRStNpzO4hmyAvJV5TOZ92mDqY@ec2-54-197-241-95.compute-1.amazonaws.com:5432/daqgo67bqvvbal';

app.use(logfmt.requestLogger());

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	res.render('index.html');
});

console.log("Registering endpoint: /connection");
app.get('/connection/', function(req, res){
	var publicUrl = req.query.puburl;

	getSkillsFromPublicUrl(publicUrl, function(skills){
		console.log(skills);
		res.send(skills);
	});

});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
	console.log("Listening on " + port);
});

function getSkillsFromPublicUrl(publicUrl, callback) {

	request(publicUrl, function(error, response, html) {

		if (error) 
			callback(error);
		else {
			var $ = cheerio.load(html);
			var skills = [];
			$('#profile-skills .content .skills li .jellybean').each(function(i, skill) {
				skills.push($(this).text().replace(/\s+/g, " ").trim());				
			});
			callback(skills);
		}
	});
};
