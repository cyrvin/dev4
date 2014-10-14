var MongoManager = require('../managers/MongoManager.js');

var schemaNafCode = new MongoManager.mongoose.Schema({
	label: {
		type: String
	},
	code: {
		type: String,
		unique: true
	}
}, {
	strict: false
});

schemaNafCode.statics.getAll = function(params, cb) {
	this
		.find()
		.exec(function(err, nafCodes) {
			cb(err, nafCodes);
		});
};

var NafCodeModel = MongoManager.mongoose.model('nafCode', schemaNafCode);

exports.NafCode = NafCodeModel;