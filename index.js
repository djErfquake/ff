const express = require('express');
const app = express();

const path = require('path');

const bodyParser = require('body-parser');

const rp = require('request-promise');
const cheerio = require('cheerio');


// variables
const NUM_OF_TEAMS = 14;
const NUM_OF_GAMES = 13;
let teams = [];


// routing and starting express server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
let leagueRouting = require(path.join(__dirname, 'routes', 'routes.js'));

app.use('/ff/league', leagueRouting);
app.get('/test', (req, res) => { res.status(200).sendFile(path.resolve(__dirname, '', 'public', 'test.html')) });
app.get('/ff/teams.json', (req, res) => { res.status(200).send(teams)});

app.listen(3000, () => console.log('Listening on port 3000'));




// load first scoreboard in order to init teams

// setup the request options
let options = {
  uri: 'http://games.espn.com/ffl/scoreboard?leagueId=1081893&matchupPeriodId=1',
  transform: function (body) {
    return cheerio.load(body);
  }
};


// make the request
rp(options)
  .then(($) => {

    for (let i = 0; i < NUM_OF_TEAMS / 2; i++) {
      let matchup = $($('.matchup')[i]);

      // first team
      let teamName0 = $(matchup.find('a')[0]).attr('title').split("(");
      let abbrev0 = $(matchup.find('.abbrev')[0]).text();
      let score0 = parseInt($(matchup.find('.score')[0]).text());
      let newTeam0 = {
        "name": teamName0[0].substring(0, teamName0[0].length - 1),
        "person": teamName0[1].substring(0, teamName0[1].length - 1),
        "abbrev": filterAbbrev(abbrev0),
        "games": [],
        "espnIndex": parseInt($(matchup.find('tr')[0]).attr('id').split("_")[1])
      };

      // second team
      let teamName1 = $(matchup.find('a')[1]).attr('title').split("(");
      let abbrev1 = $(matchup.find('.abbrev')[1]).text();
      let score1 = parseInt($(matchup.find('.score')[1]).text());
      let newTeam1 = {
        "name": teamName1[0].substring(0, teamName1[0].length - 1),
        "person": teamName1[1].substring(0, teamName1[1].length - 1),
        "abbrev": filterAbbrev(abbrev1),
        "games": [],
        "espnIndex": parseInt($(matchup.find('tr')[1]).attr('id').split("_")[1])
      };

      // fixtures
      newTeam0.games.push({ "opponent": newTeam1, "score": score0, "opponentScore": score1 });
      newTeam1.games.push({ "opponent": newTeam0, "score": score1, "opponentScore": score0 });

      teams.push(newTeam0);
      teams.push(newTeam1);
    }

    gameIndex = 2;
    updateNextGame();
  })
  .catch((err) => {
  console.log(err);
});








// FUNCTIONS



// loop through scoreboards
let gameIndex = 2;
let updateNextGame = function() {

    // setup the request options
    let options = {
      uri: 'http://games.espn.com/ffl/scoreboard?leagueId=1081893&matchupPeriodId=' + gameIndex,
      transform: function (body) {
        return cheerio.load(body);
      }
    };


    // make the request
    rp(options)
      .then(($) => {

        console.log("got response for " + gameIndex);

        for (let i = 0; i < NUM_OF_TEAMS / 2; i++) {
          let matchup = $($('.matchup')[i]);

          // first team
          let abbrev0 = $(matchup.find('.abbrev')[0]).text();
          let score0 = parseInt($(matchup.find('.score')[0]).text());
          let team0 = getTeamFromAbbrev(filterAbbrev(abbrev0));

          // second team
          let abbrev1 = $(matchup.find('.abbrev')[1]).text();
          let score1 = parseInt($(matchup.find('.score')[1]).text());
          let team1 = getTeamFromAbbrev(filterAbbrev(abbrev1));

          // fixtures
          team0.games.push({ "opponent": team1, "score": score0, "opponentScore": score1 });
          team1.games.push({ "opponent": team0, "score": score1, "opponentScore": score0 });
        }

        gameIndex++;

        if (gameIndex > NUM_OF_GAMES) { console.log("teams", teams); }
        else { updateNextGame(); }
      })
      .catch((err) => {
      console.log(err);
    });

};



let getTeamFromAbbrev = function(abbrev) {
  for (let i = 0; i < teams.length; i++) {
    if (teams[i].abbrev == abbrev) { return teams[i]; }
  }
};


let filterAbbrev = function(abbrevText) {
  return abbrevText.substring(1, abbrevText.length - 1)
}




/*

// express tutorial
https://codeburst.io/an-introduction-to-web-scraping-with-node-js-1045b55c63f7
https://github.com/request/request-promise

// to run
node --inspect index.js



// espn links
team - http://games.espn.com/ffl/scoreboard?leagueId=1081893&matchupPeriodId=1
player - http://games.espn.com/ffl/clubhouse?leagueId=1081893&teamId=1&seasonId=2018



const CAL_POINTS = '#tmTotalPts_1';
const CAL_NAME = '#teamscrg_1_activeteamrow';

console.log("Calvin scored " + $(CAL_POINTS).html() + " points");
console.log($(CAL_NAME).find("a").attr("title"));

let teams =
[
  {
    "person": "Calvin LeVally",
    "name": "Taste Buds",
    "abbrev": "CAL",
    "games": [
      { "opponent": "Molly Ringworms", "score": 37, "opponent-score": 62 },
      ...
    ],
    "wins": 0, "losses": 0,
    "streak": "L3"
  }
];
*/
