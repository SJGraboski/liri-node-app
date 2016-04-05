/* 1: SETUP
 * ========================== */

// list out our dependencies
var Twitter = require('twitter');
var spotify = require('spotify');
var request = require('request');
var fs = require('fs');


// grab the twitter keys from the keys.js file
var keyFile = require("./keys.js");
var twitterKeys = keyFile.twitterKeys;

// grab the command line argv
var lineArg1 = process.argv[2];
var lineArg2 = process.argv[3];

// grab the random.txt file
var cmdFile = "random.txt";

// grab the log.txt file
var logFile = "log.txt";

/* 2: Functions
 * ============ */

// this function logs strings both to the console and to log.txt
function conAndFileLog(str) {
	console.log(str);
	fs.appendFile("log.txt", str + "\n");
}

// call function (params are our arguments, 
// and a check for if it got calledfrom do-what-it-says)
function caller(arg1, arg2, doWhat) {
	// log the command to log.txt
	if (arg2) {
		fs.appendFile("log.txt", (arg1 + " " + arg2 + "\n"));
	}
	else {
		fs.appendFile("log.txt", (arg1 + "\n"));
	}

	// call my-tweets
	if (arg1 === 'my-tweets') {
		conAndFileLog("Running my-tweets...");
	  myTweets();
	}
	// call spotify-this-song
	if (arg1 === 'spotify-this-song') {
		conAndFileLog("Running spotify-this-song...");
		spotifyThisSong(arg2);
	}
	// call movie-this
	if (arg1 === 'movie-this') {
		conAndFileLog("Running movie-this...");
		movieThis(arg2);
	}
	// call do-what-it-says
	if (arg1 === 'do-what-it-says' && !doWhat) {
		conAndFileLog("Running do-what-it-says...");
		doWhatItSays();
	}
	// but if this comes from the do-what-it-says function, avoid an infinite loop
	if (arg1 === 'do-what-it-says' && doWhat) {
		conAndFileLog("Look, we're not going run do-what-it-says for ever, are we?");
		conAndFileLog("Exiting program, you joker...");
	}
}

// a) myTweets
function myTweets() {

	// start our twitter call with a new Twitter obj
	var client = new Twitter(twitterKeys);

	// define the parameters of our call
	var params = {screen_name: 'sjgraboski'};

	// send out the call to the Twitter API
	client.get('statuses/user_timeline', params, function(error, timeline, response) {
		
		// if no errors... 
		if (!error) {

			// ...then do the following for each tweet in our timeline.
			for (tweet in timeline) {

				// So long as this isn't the 20th tweet yet
				if (tweet < 20) { 

					// get the date of the tweet
					var tweetDate = new Date(timeline[tweet].created_at);
					console.log(tweetDate);

					// log out the date and text of our latest tweets.
					conAndFileLog("Tweet #" + (parseInt(tweet) + 1) + 
												" // Date: " + tweetDate.toString().slice(0, 24)); // keep only important date info
					conAndFileLog(timeline[tweet].text);
				}
				// If it is the 20th tweet (or higher)
				else {

					// return true (and end our function).
					return true;
				}
			}
		}
		// If there was an error, though
		else {

			// log it to the console.
			conAndFileLog(error);
		}
	});
}

// b) spotify-this-song
function spotifyThisSong(arg2) {

	// grab song name from caller() arg2.
	var song = arg2;

	// if no song entered, throw up an error message and kill the process.
	if (!song) {
		conAndFileLog("ERROR: You didn't enter a song!" +
								"Enter an argument next to the command next time.");
		return;
	}

	// params for spotify call
	var params = {
		type: 'track',
		query: song + '&limit=1' // we limit our search to one track.
	}
 
 	// spotify API call
	spotify.search(params, function(err, data) {

			// log any errors.
	    if ( err ) {
	      conAndFileLog('Spotify error occurred: ' + err);
	    }
	    // otherwise, tell the user about the song they searched for.
	    else {

	    	// shorthand for easy data perusal.
	    	var song = data.tracks.items[0];

	    	// name of song and artist.
	    	conAndFileLog('"' + song.name + '", by ' + song.artists[0].name);

	    	// name of the album.
	    	conAndFileLog('from the album "' + song.album.name + '"');

	    	// preview link.
	    	conAndFileLog('Preview: ' + song.external_urls.spotify);
	    }
	});
}

// c) movie-this
function movieThis(arg2) {

	// grab song name from caller() arg2.
	var movie = arg2;

	// set our parameters.
	var options = {
		url: 'http://www.omdbapi.com/?t=' + movie + '&tomatoes=true'
	}

	// define our callback function.
	function callback(error, response, body) {

		// if no errors
		if (!error && response.statusCode == 200) {

			// parse the body of the recieved info into JSON so we can scan it.
			var info = JSON.parse(body);

			/* display the movie info;
			 * ======================= */

			// Title
			conAndFileLog('Title: ' + info.Title);
			// Year
			conAndFileLog('Year: ' + info.Year);
			// IMDB Rating
			conAndFileLog('IMDB Rating: ' + info.imdbRating);
			// Country
			conAndFileLog('Country: ' + info.Country);
			// Language
			conAndFileLog('Language: ' + info.Language);
			// Plot
			conAndFileLog('Plot: ' + info.Plot);
			// Actors
			conAndFileLog('Actors: ' + info.Actors);
			// Rotten Tomatoes Rating
			conAndFileLog('Rotten Tomatoes Rating: ' + info.tomatoUserMeter);
			// Rotten Tomatoes Url
			conAndFileLog('Rotten Tomatoes URL: ' + info.tomatoURL);
		}
		// if the program encounters an error here, log it
		else {
			conAndFileLog("OMDB error: " + error);
		}
	}
	// run the request module's main function with the above information
	request(options, callback);
}

// d) do-what-it-says
function doWhatItSays() {
	// read the file we defined at the top of the program
	var cmd = fs.readFile(cmdFile, 'utf-8', function(err, data) {

		/* Fun with ternary conditionals!
		 * ------------------------------ 
		 * cmdArray will equal one of two values, dependent on if fs gives an error
		 * If there's no error, cmdArray is the split of the random.txt file contents
		 * If there is an error, then cmdArray simply equals false */
		var cmdArray = !err ? data.split(',') : false;

		// if cmdArray doesn't equal false, prepare our caller function
		if (cmdArray) {

			// the first arg is the first element in cmdArray
			var doArg1 = cmdArray[0];

			// the second arg, the second element 
			// (or empty string if there is no second arg)
			var doArg2 = cmdArray[1] ? cmdArray[1] : "";

			// now call one of our functions
			caller(doArg1, doArg2, true);
		}
		// if cmdArray is false, and thus there's an fs error
		else {
			console.log("do-what-it-says error: " + err);
		}
	})
}

/* 3: Calls
 * ======== */
caller(lineArg1, lineArg2, false);