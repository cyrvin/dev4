var _ = require('underscore');
var Q = require('q');
var config = require('../config/global.js').newsaggregator;
var NafCodeWorker = require('./workers/nafCodeWorker');
var CompagniesByNafDepWorker = require('./workers/compagniesByNafDepWorker');

function Scrapper() {};

Scrapper.prototype.scrapNafCodes = function(cb) {
	var nafCodeWorker = new NafCodeWorker();
	nafCodeWorker.getNafCodes(function(nafCodes) {
		console.log(nafCodes.length);
	});
};

// Scrapping by department
Scrapper.prototype.scrapCompagnies = function(depId) {



	CompagniesByNafDepWorker(depId, );
};

module.exports = Scrapper;