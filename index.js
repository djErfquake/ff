const express = require('express');
const app = express();

const path = require('path');

const bodyParser = require('body-parser');

const rp = require('request-promise');
const cheerio = require('cheerio');

const _ = require('lodash');


// variables
const NUM_OF_TEAMS = 14;
const NUM_OF_GAMES = 13;

let createScoreboardUrl = function(weekNumber) { return 'http://games.espn.com/ffl/scoreboard?leagueId=1081893&matchupPeriodId=' + weekNumber; };

let createMatchupUrl = function(teamNumber, weekNumber) { return 'http://games.espn.com/ffl/boxscorequick?leagueId=1081893&seasonId=2017&teamId=' + teamNumber + '&scoringPeriodId=' + weekNumber; };

let teams = {};


// routing and starting express server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
let leagueRouting = require(path.join(__dirname, 'routes', 'routes.js'));

app.use('/ff/league', leagueRouting);
app.get('/test', (req, res) => { res.status(200).sendFile(path.resolve(__dirname, '', 'public', 'test.html')) });
app.get('/ff/teams.json', (req, res) => { res.status(200).send(JSON.stringify(teams))});

app.listen(3000, () => console.log('Listening on port 3000'));




// load first scoreboard in order to init teams
let gamesScraped = [];

// setup the request options
let options = {
  uri: createScoreboardUrl(1),
  transform: function (body) {
    return cheerio.load(body);
  }
};


// make the request
rp(options)
  .then(($) => {

    console.log("getting results for week 1");

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
      newTeam0.games[0] = { "score": score0, "opponent": filterAbbrev(abbrev1), "opponentScore": score1 };
      newTeam1.games[0] = { "score": score1, "opponent": filterAbbrev(abbrev0), "opponentScore": score0 };

      teams[newTeam0.abbrev] = newTeam0;
      teams[newTeam1.abbrev] = newTeam1;
    }



    // everyone
    Object.keys(teams).map(function(key) {
      let team = teams[key];
      gamesScraped[team.abbrev] = 0;
      team.players = [];
      updateNextGameForPlayer(team);
    });


    /*
    // just calvin
    gamesScraped['CAL'] = 0;
    teams['CAL'].players = [];
    updateNextGameForPlayer(teams['CAL']);
    */

  })
  .catch((err) => {
  console.log(err);
});








// FUNCTIONS

let updateNextGameForPlayer = function(team) {

    let gameIndex = gamesScraped[team.abbrev] + 1;
    console.log(team.abbrev + ": week " + gameIndex.toString());

    // setup the request options
    let options = {
      uri: createMatchupUrl(team.espnIndex, gameIndex),
      transform: function (body) { return cheerio.load(body); }
    };

    // make the request
    rp(options)
      .then(($) => {

        let playerInfo = $($('.playerTableTable')[0]);
        let numOfPlayers = $(playerInfo.find($('.pncPlayerRow'))).length;

        for (let i = 0; i < numOfPlayers; i++) {

          let totalScore = parseInt($($('.totalScore')[0]).text());
          if (team.games[gameIndex - 1] == undefined) {
            let opponentNameText = $($('.playerTableBgRowHead')[1]).find('td').text();
            let opponent = opponentNameText.substring(0, opponentNameText.length - 10);
            let opponentScore = parseInt($($('.totalScore')[1]).text());

            team.games[gameIndex - 1] = { "score": totalScore, "opponent": getTeamFromName(opponent), "opponentScore": opponentScore };
          }
          else {
            team.games[gameIndex - 1].score = totalScore;
          }

          let playerRow = $($(playerInfo.find($('.pncPlayerRow')))[i]);
          let playerName = playerRow.find('.playertablePlayerName').find('a').text();
          let playerScore =  parseInt(playerRow.find('.appliedPoints').text());

          let player = team.players[playerName];
          if (player == undefined) {
            let playerPosition = playerRow.find('.playerSlot').text();

            team.players[playerName] = {
              position: playerPosition,
              name: playerName,
              scores: []
            };
          }

          team.players[playerName].scores[gameIndex - 1] = playerScore == NaN ? 0 : playerScore;
        }

        gamesScraped[team.abbrev]++;
        if (gamesScraped[team.abbrev] < NUM_OF_GAMES) {
          updateNextGameForPlayer(team);
        } else {
          console.log("team", team);
        }

      })
      .catch((err) => {
      console.log(err);
    });
};


let filterAbbrev = function(abbrevText) {
  return abbrevText.substring(1, abbrevText.length - 1);
};

let getTeamFromName = function(teamName) {
  Object.keys(teams).map(function(key) {
    let team = teams[key];
    if (team.name == teamName) { return team; }
  });
  return undefined;
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
