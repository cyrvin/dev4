var request 	= require('request');
var cheerio 	= require('cheerio');
var workerFarm 	= require('worker-farm')
var insertIgnoreWorkers  = workerFarm(require.resolve('./rds-insert-ignore'));

var nbEntriesPerPage = 80;

/*--------------------------- KompassActivity class ---------------------------*/

module.exports = function(activityUrl, callback) {
	console.log('  -> Activity : ' + activityUrl);
	request(activityUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content .row .prod_list a').each(function() {
			insertIgnoreWorkers('companyUrls', 'url', $(this).attr('href'), function(err, companyUrl){
				if (err) console.log(err)
				else console.log('OK Insert ' + companyUrl);
			});
			console.log($(this).attr('href'));
		});

		$('#result-count > strong').each(function() {
			nbResultat = parseInt($(this).text());
			if (nbResultat <= nbEntriesPerPage) return;

			nbPages = Math.min(Math.ceil(nbResultat / nbEntriesPerPage), 5); //Paging limité à 5 pages sur le search

			for (var i = 2 ; i <= nbPages ; i++) {
				activityPageNext(activityUrl, activityUrl + 'page-' + i + '/');
			}
		});
	});
	callback(null, activityUrl);
}

/*--------------------------- Internal functions ---------------------------*/

function activityPageNext(activityRootUrl, activityUrl) {
	console.log('  -> Activity : ' + activityUrl);
	request(activityUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		var mydb = new Mydb();
		$('#content .row .prod_list a').each(function() {
			insertIgnoreWorkers('companyUrls', 'url', $(this).attr('href'), function(err, companyUrl){
				if (err) console.log(err)
				else console.log('OK Insert ' + companyUrl);
			});
		});
	});
}



