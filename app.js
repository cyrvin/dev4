var express = require("express");
var Kompass = require('./kompass');
var Europages = require('./europages');

var app = express();

var port = Number(process.env.PORT || 5000);

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
	res.send(process.env.RDS_HOSTNAME);
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
