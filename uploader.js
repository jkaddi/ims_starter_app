'use strict';

var fs = require('fs'),
request = require('request'),
apiUrl = '<Insert the URI for your app here>';


var addCollection = function addCollection(collectionName, contents, zoneId, bearerStr) {
	
	var contentJson = JSON.parse(contents);
	var factor = Math.round(contentJson.features.length / 1000);
	
	for (var i = 0; i < contentJson.features.length; i += 1000) {
		var end = Math.min(i + 1000, contentJson.features.length);
		console.log("Uploading " + i + " to " + end);
		var content = JSON.stringify({
			type: "FeatureCollection",
			features: contentJson.features.splice(i, end)
		})
		
		var options = {
			method : 'POST',
			url : apiUrl + collectionName,
			headers : {
				'Content-Type' : 'application/json',
				'Predix-Zone-Id' : zoneId,
				'x-subtenant-Id' : 'philtenant',
				'Authorization' : bearerStr
			},
			body : content
		};

		//console.log(bearerStr);
		console.log("Requesting upload to " + apiUrl + collectionName);

		request(options, function (error, res, body) {
			if (error) {
				console.log('Problem with request', error);
			} else {
				console.log('STATUS:', res.statusCode);
				console.log('BODY:', body);
			}
		});
	}
};

var main = function main() {
	var filename = process.argv[2];
	var collectionName = process.argv[3];
	var zoneId = process.argv[4];
	var contents = fs.readFileSync(filename, 'utf-8');
	var bearerStr = process.argv[5];

	var tokenPromise = getToken();

	tokenPromise.then(function () {
		addCollection(collectionName, contents, zoneId, bearerStr);
	});
}

main();