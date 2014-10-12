// http://www.societe.com/cgi-bin/liste?ape=0111Z&dep=1 mais que 1000 premiers résultats!!
// Teste en passant par les dirigeants par recherche par année de naissance mais limitation à 2 enterprises 

var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var Q = require('q');

var CompagniesByNafDepWorker = function() {};

NafCodeWorker.prototype.getNafCodes = function(callback) {
	var self = this;

	var scrapNafCodePagesPromises = _.range(1, 100).reduce(function(cur, index) {
		return cur.then(function() {
			return self.scrapNafCodePage(index);
		});
	}, Q());

	scrapNafCodePagesPromises
		.then(function() {
			console.log('Naf codes scrap: DONE');
		})
		.done();
};

NafCodeWorker.prototype.scrapNafCodePage = function(index) {
	var deferred = Q.defer();

	var url = 'http://www.societe.com/cgi-bin/liste?image3=&naf=' + (index < 9 ? '0' + index : index);

	request(url, function(error, response, html) {
		console.log(error);
		var $ = cheerio.load(html);
		var $nafCategoryTitle = '';
		var $nafIds = $('a.txtBleuFonce.noUnder:not(.size9)');
		var nafCodePromises = [];
		$nafIds.each(function($nafId) {
			var codeDefer = Q.defer();
			nafCodePromises.push(codeDefer.promise);

			var params = {
				code: $(this).attr('href').split("naf=")[2],
				label: $(this).text()
			};

			var nafCode = new NafCodeModel(params);
			nafCode.save(function(err) {
				codeDefer.resolve();
			});

		});
		Q.allSettled(nafCodePromises)
			.then(function() {
				console.log('Index: ' + index + '   ' + $nafIds.length);
				deferred.resolve();
			});
	});
	return deferred.promise;
};

module.exports = NafCodeWorker;