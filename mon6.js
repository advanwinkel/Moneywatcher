// Moneyou watcher

var https = require('https');

require('./db');

var mongoose = require('mongoose');
var Rt = mongoose.model('Ratetab');

var querystring = require('querystring');

// Moneyou´s RestApi expects this string to be posted
var postdata = querystring.stringify({
      start: '{"application":"AAHG.HypothekenRekentools.MoneYou","version":null,"startFlow":"Renteblad","queryString":""}'
    });

//Request options
var options = {
	host: 'modules.moneyou.nl',
	port: 443,
	path: '/AppEngineProxy.aspx',
	method: 'POST',
	headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postdata)
    }
};

//Labels for the various interest rate periods
var labels = [
	"variabel",
	"vast1jr",
	"vast5jr",
	"vast10jr",
	"vast15jr",
	"vast20jr",
	"vast30jr"
];

//The https request to Moneyou´s RestApi
var req = https.request(options, function(res) {

	var output = '';
	//console.log('STATUS: ' + res.statusCode);
	//console.log('HEADERS: ' + res.headers['content-length']);
	res.setEncoding('utf8');
	res.on('data', function (chunk) {
		output += chunk;
	});

	res.on('end', function () {

		processData(output);
	});
});

// write data to request body
req.write(postdata);
req.end();

//Process the JSON structure returned by Moneyou
function processData(output){
	var tab = [];
	montab = {};
	var mcat = [];
	
	//filter table data to be stored in data base
	for (i =0 ; i < 7 ; i++) {
		tab[i] = JSON.parse(output).page.content[0].content[1].content[1].rows[i];
		tab[i].splice(1,1);
	montab[labels[i]] = tab[i].slice(1,6);
	}

	//console.log(montab);
	//Restructure the interest data, necessary because 
	//Mongoose can´t handle multidimensional arrays
	for (i =0 ; i < 4 ; i++) {
		mcat[i] = {
			variabel: montab.variabel[i][1],
			vast1jr: montab.vast1jr[i][1],
			vast5jr: montab.vast5jr[i][1],
			vast10jr: montab.vast10jr[i][1],
			vast15jr: montab.vast15jr[i][1],
			vast20jr: montab.vast20jr[i][1],
			vast30jr: montab.vast30jr[i][1]
		}
	}
	//console.log(mcat[0]);
	//Insert restructured interest table in the data base
	Rt.create({
        mcats: mcat,
        timestamp: Date()
    }, function(err, rtab) {
	    if (err) {
	      console.log(err);
	    } else {
	      //console.log(rtab.mcats[2]);
	      console.log(rtab);
	    }
  	});
	//Find previous interest table in the data base and compare with the new one
  	Rt
      .findOne()
      .sort({timestamp: -1})
      .exec(function(err, rtab) {
        //console.log("previous" + rtab.mcats[2]);
        var bChanged = false;

        if (mcat[2].variabel != rtab.mcats[2].variabel){
          bChanged = true;
    	  sendMessage("Variabel", mcat[2].variabel);
		  console.log("variabel changed: " + mcat[2].variabel);
	    }
        if (mcat[2].vast10jr != rtab.mcats[2].vast10jr){
          bChanged = true;
    	  sendMessage("Vast10jr", mcat[2].vast10jr);
		  console.log("vast10jr changed: " + mcat[2].vast10jr);
	    }
	    if (mcat[2].vast15jr != rtab.mcats[2].vast15jr){
          bChanged = true;
    	  sendMessage("Vast15jr", mcat[2].vast15jr);
		  console.log("vast15jr changed: " + mcat[2].vast15jr);
	    }
	    if (mcat[2].vast20jr != rtab.mcats[2].vast20jr){
          bChanged = true;
    	  sendMessage("Vast20jr", mcat[2].vast20jr);
		  console.log("vast20jr changed: " + mcat[2].vast20jr);
	    }

	    if ( bChanged == false ){   
	      console.log("no change");
	    }
	    mongoose.disconnect();
      });
}

function sendMessage(interest, rate){

	var nodemailer = require('nodemailer');

	var transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'advanwinkel@gmail.com',
			pass: 'Corrie80'
		}
	});

	var mail_text = 'Rente gewijzigd: ' + interest + ' ' + rate

	transporter.sendMail({
		from: 'advanwinkel@gmail.com',
		to: 'advanwinkel@gmail.com',
		subject: 'Moneyou',
		text: mail_text
	});
}
