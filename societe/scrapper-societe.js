var optimist = require('optimist');
var os = require('os');

var argv = optimist.usage('\n node scrapper-societe.js (-port port -s)')
    .alias('h', 'help')
    .alias('h', '?')
    .options('port', {
        alias: "p",
        string: true,
        describe: 'Http Port',
        default: 9091
    })
    .options('s', {
        alias: "s",
        describe: 'Scrapper run',
        string: true,
        default: false
    })
    .argv;

if (argv.help) {
    optimist.showHelp();
}

var env = argv.env;
var port = process.env.PORT || argv.port;
var scrapperInit = argv.s || false;

console.log('\nScrapper societe.com \n\nPort #' + port + '\nScrapper ' + scrapperInit);

var App = require('./app');
var app = new App();

var options = {
    port: port,
    scrapperInit: scrapperInit
};

app.start(options);