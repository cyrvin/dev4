var express = require('express');
var apiRouter = express();

var SocieteMiddleware = require('../middlewares/societeMiddleware');
apiRouter.post('/societe', SocieteMiddleware.aggregateCompagnies);

var NafMiddleware = require('../middlewares/nafMiddleware');
apiRouter.get('/naf', NafMiddleware.getAll);

module.exports = apiRouter;