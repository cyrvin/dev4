var request = require('request');
var cheerio = require('cheerio');
var fs 		= require('fs');
var readline = require('readline');
var stream = require('stream');

var indexPages = new Array();

/*--------------------------------------------------------------------------
							CLASSE EUROPAGES
--------------------------------------------------------------------------*/
var Europages = function(){};

Europages.prototype.companyIndexScrap = function(companyIndexPage) {
	console.log("On commence le scrapping de " + companyIndexPage);
	request(companyIndexPage, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#topsearchresults .padd-bloc-index nav .line a').each(function() {
			var href = $(this).attr('href');
			if (href.substring(0,23) != 'http://www.europages.fr') href = 'http://www.europages.fr' + href;
			indexPages[href] = true;
			companyIndexPasse2(href);
		});
	});
}

module.exports = Europages;

/*--------------------------------------------------------------------------
							FONCTIONS
--------------------------------------------------------------------------*/

function companyIndexPasse2(companyIndexPage) {
	request(companyIndexPage, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#topsearchresults .padd-bloc-index nav .line a').each(function() {
			var href = $(this).attr('href');
			if (href.substring(0,23) != 'http://www.europages.fr') href = 'http://www.europages.fr' + href;
			indexPages[href] = true;
			console.log(href);
		});
	});
}

module.exports = Europages;
