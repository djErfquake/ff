const express = require('express');
const app = express();

const path = require('path');

const bodyParser = require('body-parser');

const rp = require('request-promise');
const cheerio = require('cheerio');

const _ = require('lodash');

const cliProgress = require('cli-progress');


// variables
const NUM_OF_TEAMS = 14;
const NUM_OF_WEEKS = 13;
const ESPN_LEAGUE_ID = "1081893";
const YEAR = "2018";

let createScoreboardUrl = function(weekNumber) { return 'http://games.espn.com/ffl/scoreboard?leagueId=' + ESPN_LEAGUE_ID + '&matchupPeriodId=' + weekNumber + '&seasonId=' + YEAR; };

let createMatchupUrl = function(teamNumber, weekNumber) { return 'http://games.espn.com/ffl/boxscorequick?leagueId=' + ESPN_LEAGUE_ID + '&seasonId=' + YEAR + '&teamId=' + teamNumber + '&scoringPeriodId=' + weekNumber; };


// routing and starting express server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
let leagueRouting = require(path.join(__dirname, 'routes', 'routes.js'));

//app.use('/ff/league', leagueRouting);
app.use('/', leagueRouting);
app.get('/test', (req, res) => { res.status(200).sendFile(path.resolve(__dirname, '', 'public', 'test.html')) });
app.get('/teams.json', (req, res) => { res.status(200).send(JSON.stringify(teams))});
app.get('/trophies.json', (req, res) => { res.status(200).send(JSON.stringify(trophies))});

const port = process.env.PORT || 3000;
app.listen(port);
console.log('Listening on port ' + port);



// ui
const progressBar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic);
let progressValue = 0;

// load first scoreboard in order to init teams
let teams = {};
let trophies = {};
let gamesScraped = [];
let teamDoneCount = 0;

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

    console.log("Loading Team Info...");
    progressBar.start(NUM_OF_TEAMS * NUM_OF_WEEKS, 0);

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
      team.players = {};
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
    //console.log(team.abbrev + ": week " + gameIndex.toString());

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

        let totalScore = parseInt($($('.totalScore')[0]).text());
        let opponentNameText = $($('.playerTableBgRowHead')[1]).find('td').text();
        let opponent = opponentNameText.substring(0, opponentNameText.length - 10);
        if (opponent == "") {
          opponent = "BYE";
        } else {
          let opponentTeam = getTeamFromName(opponent);
          if (opponentTeam == undefined) {
            console.log("ERROR: " + opponentNameText + " is undefined.");
          }

          opponent = opponentTeam.abbrev;
        }
        let opponentScore = parseInt($($('.totalScore')[1]).text());
        opponentScore = (opponentScore === NaN) ? 0 : opponentScore;



        if (team.games[gameIndex - 1] == undefined) {
          team.games[gameIndex - 1] = { "score": totalScore, "opponent": opponent, "opponentScore": opponentScore };
        }
        else {
          team.games[gameIndex - 1].score = totalScore;
          team.games[gameIndex - 1].opponent = opponent;
          team.games[gameIndex - 1].opponentScore = opponentScore;
        }


        for (let i = 0; i < numOfPlayers; i++) {

          let playerRow = $($(playerInfo.find($('.pncPlayerRow')))[i]);
          let playerName = playerRow.find('.playertablePlayerName').find('a').text();
          let playerRowId = playerRow.attr('id');
          let playerEspnIndex = playerRowId.substring(4, playerRowId.length);
          let playerScore =  parseInt(playerRow.find('.appliedPoints').text());
          playerScore = (playerScore === NaN) ? 0 : playerScore;

          let player = team.players[playerName];
          if (player == undefined) {
            let playerPosition = playerRow.find('.playerSlot').text();

            team.players[playerName] = {
              position: playerPosition,
              name: playerName,
              scores: [],
              totalPoints: 0,
              espnIndex: playerEspnIndex
            };
          }

          team.players[playerName].scores[gameIndex - 1] = playerScore;
          team.players[playerName].totalPoints += playerScore;
        }

        progressValue++;
        progressBar.update(progressValue);

        gamesScraped[team.abbrev]++;
        if (gamesScraped[team.abbrev] < NUM_OF_WEEKS) {
          updateNextGameForPlayer(team);
        } else {
          teamDoneCount++;
          if (teamDoneCount >= NUM_OF_TEAMS) {
            updateTrophies();
          }

        }

      })
      .catch((err) => {
      console.log(err);
    });
};



let updateTrophies = function() {

  let trophySassyNicCage = {
    name: "Sassy Nicolas Cage",
    description: "weekly award to the team that scores the most points",
    best: { points: 0 },
    weeks: []
  };

  let trophyLeprechaun = {
    name: "Leprecahun with Backwards Knee Joints",
    description: "weekly award to the team with the player that scores the most points",
    best: { points: 0 },
    weeks: []
  };

  let trophyUnlucky = {
    name: "Lucky Rabbit's Foot",
    description: "weekly award to the player that scored the most and still lost",
    best: { points: 0 },
    weeks: []
  };

  let trophyLucky = {
    name: "Lucky Duck",
    description: "weekly award to the player that scored the least and still won",
    best: { points: 999 },
    weeks: []
  };




  // loop through weeks
  for (let i = 0; i < NUM_OF_WEEKS; i++) {

    let bestTeam = {
      points: 0
    };

    let bestPlayer = {
      points: 0
      // TODO: add pick number
    };

    let unluckiestTeam = {
      points: 0
    };

    let luckiestTeam = {
      points: 999
    }


    // loop through teams
    Object.keys(teams).map(function(teamKey) {

      let team = teams[teamKey];

      // best team
      if (team.games[i].score > bestTeam.points) {
        bestTeam.team = team.abbrev;
        bestTeam.points = team.games[i].score;
        bestTeam.opponent = team.opponent;
      }

      // unluckiest team
      if (team.games[i].score < team.games[i].opponentScore && team.games[i].score > unluckiestTeam.points) {
        unluckiestTeam.team = team.abbrev;
        unluckiestTeam.points = team.games[i].score;
        unluckiestTeam.opponent = team.games[i].opponent;
        unluckiestTeam.opponentScore = team.games[i].opponentScore;
      }

      // luckiest team
      if (team.games[i].score > team.games[i].opponentScore && team.games[i].score < luckiestTeam.points) {
        luckiestTeam.team = team.abbrev;
        luckiestTeam.points = team.games[i].score;
        luckiestTeam.opponent = team.games[i].opponent;
        luckiestTeam.opponentScore = team.games[i].opponentScore;
      }

      // loop through players on each team
      Object.keys(team.players).map(function(playerKey) {

        let player = team.players[playerKey];
        if (player.scores[i] != undefined && player.scores[i] > bestPlayer.points) {
          bestPlayer.team = team.abbrev;
          bestPlayer.points = player.scores[i];
          bestPlayer.player = player;
          bestPlayer.opponent = team.opponent;
        }

      });

    });

    trophySassyNicCage.weeks[i] = bestTeam;
    if (bestTeam.points > trophySassyNicCage.best.points) {
      trophySassyNicCage.best = bestTeam;
      trophySassyNicCage.best.week = i;
    }

    trophyLeprechaun.weeks[i] = bestPlayer;
    if (bestPlayer.points > trophyLeprechaun.best.points) {
      trophyLeprechaun.best = bestPlayer;
      trophyLeprechaun.best.week = i;
    }

    trophyUnlucky.weeks[i] = unluckiestTeam;
    if (unluckiestTeam.points > trophyUnlucky.best.points) {
      trophyUnlucky.best = unluckiestTeam;
      trophyUnlucky.best.week = i;
    }

    trophyLucky.weeks[i] = luckiestTeam;
    if (luckiestTeam.points < trophyLucky.best.points) {
      trophyLucky.best = luckiestTeam;
      trophyLucky.best.week = i;
    }
  }

  trophies["best-team"] = trophySassyNicCage;
  trophies["best-player"] = trophyLeprechaun;
  trophies["luckiest-team"] = trophyLucky;
  trophies["unluckiest-team"] = trophyUnlucky;

  progressBar.stop();

  //console.log("Trophies", trophies);
  //console.log("Teams", teams);
};




// HELPER METHODS

let filterAbbrev = function(abbrevText) {
  return abbrevText.substring(1, abbrevText.length - 1);
};


let getTeamFromName = function(teamName) {
  let foundTeam = undefined;
  Object.keys(teams).map(function(key) {
    let team = teams[key];
    if (team.name == teamName) { foundTeam = team; }
  });
  return foundTeam;
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
