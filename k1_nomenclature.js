var request = require('request');
var cheerio = require('cheerio');
var workerFarm = require('worker-farm')

var kompassActivityworkers = workerFarm(require.resolve('./k2_activite'));

/*--------------------------- KompassNomenclature class ---------------------------*/

var KompassNomenclature = function(){};

KompassNomenclature.prototype.nomenclaturePage = function(countryCode) {

	var nomPage = 'http://' + countryCode + '.kompass.com/showNomenclature/';

	request(nomPage, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content > div > div > ul.categorie > li.span6 > a').each(function() {
			pageNomenclatureN2('http://' + countryCode + '.kompass.com' + $(this).attr('href'));
		});
	});
}

module.exports = KompassNomenclature;

/*--------------------------- INTERNAL FUNCTIONS ---------------------------*/

function pageNomenclatureN2(nomenclatureUrl) {
	console.log('Nom2 : ' + nomenclatureUrl);
	request(nomenclatureUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content > div > div > div > div.tab-content.pull-right > div.tab-pane > ul > li > a').each(function() {
			kompassActivityworkers($(this).attr('href'), function(err, outp) {
				if (err) console.log(err)
				else console.log('Terminé : ' + outp);
			});
		});
	});
}

