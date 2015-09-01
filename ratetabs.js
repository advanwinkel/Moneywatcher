//Mongoose schema for Moneyou watcher


var mongoose = require( 'mongoose' );

var mcatSchema = new mongoose.Schema({
  variabel: {type: Number, required: true},
  vast1jr: {type: Number, required: true},
  vast5jr: {type: Number, required: true},
  vast10jr: {type: Number, required: true},
  vast15jr: {type: Number, required: true},
  vast20jr: {type: Number, required: true},
  vast30jr: {type: Number, required: true}
});

var ratetabSchema = new mongoose.Schema({
   mcats: [mcatSchema],
   timestamp: {type: Date, required: true}
});

mongoose.model('Ratetab', ratetabSchema);
