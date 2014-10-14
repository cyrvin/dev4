var express = require("express");
var KompassNomenclature = require('./kompass2/scrap-nomenc-page');

var workerFarm = require('worker-farm')
var activityPageScrapper 	= workerFarm(require.resolve('./queries/activity-pages-iterator'));

var app = express();

var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
	console.log("Listening on " + port);
});

/*------------------- FICHIER INDEX ------------------*/

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	res.render('index.html');
});

app.get('/kompass/scrapnomenclature/', function(req, res) {
	if (req.query.country == undefined) {
		console.log('Code pays manquant !');
		return;}

	var kompass = new KompassNomenclature();
	kompass.nomenclaturePage(req.query.country);
});

app.get('/kompass/scrapactivity/', function(req, res) {
	activityPageScrapper(function(){
		console.log('fini ?');
	});
});

