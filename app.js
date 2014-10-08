var express = require("express");
var Kompass = require('./kompass');
var Europages = require('./europages');
var mysql      = require('mysql');

var app = express();

//var port = Number(process.env.PORT || 5000);
var port = Number(process.env.PORT || 6001);

app.listen(port, function() {
	console.log("Listening on " + port);
});

/*------------------- FICHIER INDEX ------------------*/

app.use(express.static(__dirname + '/public'));

/*--------------------------- ROUTES ------------------*/

app.get('/', function(req, res) {
	res.render('index.html');
});

app.get('/test/', function(req, res) {
	res.send('-> Host : ' + process.env.RDS_HOSTNAME);
	res.send('-> User : ' + process.env.RDS_USERNAME);
	res.send('-> User : ' + process.env.RDS_PASSWORD);
	res.send('-> Port : ' + process.env.RDS_PORT);
});

/*--------------------------- SCRAP KOMPASS ---------------------------*/

app.get('/kompass/scrapnomenclature/', function(req, res) {
	if (req.query.country == undefined) {
		console.log('Code pays manquant !');
		return;
	}

	var kompass = new Kompass();
	kompass.pageNomenclature(req.query.country);
});

app.get('/kompass/scrapcompanies/', function(req, res) {
	if (req.query.country == undefined) {
		console.log('Code pays manquant !');
		return;
	}

	var kompass = new Kompass();
	kompass.iterateOnCompanyPages(req.query.country);
});

/*--------------------------- SCRAP EUROPAGES --------------------------- */
