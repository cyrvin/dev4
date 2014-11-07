var casper = require('casper').create({
	verbose: true,
	stepTimeout: 10000,
	waitTimeout: 1000,
	pageSettings: {
		loadImages: false,
		loadPlugins: false
	},
	onError: function() {
		this.captureSelector('error.png', 'html');
	},
	logLevel: 'debug'
});

var siren = '522393511';

casper.start('http://www.societe.com');

casper.then(function() {	
	if (this.exists('input#Search')) {
		console.log('search field');

		this.fill('form#FormSearch', {
			champ: siren
		}, true);
	}
});

casper.then(function() {
	console.log('clicked ok, new location is ' + this.getCurrentUrl());
});

casper.run(function() {
	this.echo('DONE').exit();
});