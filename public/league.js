const ESPN_LEAGUE_ID = "1081893";
const YEAR = "2018";

let teams;
let players = [];

let trophies = [];
let matchups = [];

let totalGameWeeks = 13;
let currentGameWeek = 0;


$.getJSON('https://games.espn.com/ffl/api/v2/teams?leagueId=' + ESPN_LEAGUE_ID, function(teamsData) {

  // sort teams by number of points scored
  teams = teamsData.teams;
  teams.sort(function(a,b) {return (a.record.pointsFor < b.record.pointsFor) ? 1 : ((b.record.pointsFor < a.record.pointsFor) ? -1 : 0);} );

  $.getJSON('https://games.espn.com/ffl/api/v2/scoreboard?leagueId=' + ESPN_LEAGUE_ID, function(scoreboardData) {

    // get current game week
    totalGameWeeks = teams[0].scheduleItems.length;
    currentGameWeek = scoreboardData.scoreboard.scoringPeriodId - 1;
    let seasonPercentage = ((currentGameWeek + 1) / totalGameWeeks) * 100;
    $('.season-progress').css('width', seasonPercentage.toString() + "%");

    // add matchup info
    let totalMatchups = currentGameWeek * teams.length;
    let matchupsAdded = 0;

    for (let matchupPeriodIndex = 0; matchupPeriodIndex < currentGameWeek; matchupPeriodIndex++) {
      for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
        let teamId = teams[teamIndex].teamId;
        $.getJSON('https://games.espn.com/ffl/api/v2/boxscore?leagueId=' + ESPN_LEAGUE_ID +
        '&matchupPeriodId=' + matchupPeriodIndex +
        '&teamId=' + teamId,
        function(boxscoreData) {
          if (teams[teamIndex].boxscores == undefined) {teams[teamIndex].boxscores = [];}
          teams[teamIndex].boxscores[matchupPeriodIndex] = boxscoreData.boxscore;

          matchupsAdded++;
          //console.log(matchupsAdded + "/" + totalMatchups);
          if (matchupsAdded == totalMatchups) { analyzeData(); }
        });
      }
    }



  });
});


let analyzeData = function() {

  let player1 = { points: 0 };
  let player2 = { points: 0 };
  let player3 = { points: 0 };

  for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
    for (let matchupPeriodIndex = 0; matchupPeriodIndex < currentGameWeek; matchupPeriodIndex++) {

      let boxscore = teams[teamIndex].boxscores[matchupPeriodIndex];
      for (let matchupTeamIndex = 0; matchupTeamIndex < 2; matchupTeamIndex++) {

        let boxscorePlayers = boxscore.teams[matchupTeamIndex].slots;
        for (let playerIndex = 0; playerIndex < boxscorePlayers.length; playerIndex++) {

          if (boxscorePlayers[playerIndex].currentPeriodProjectedStats != undefined) {
            let playerScore = boxscorePlayers[playerIndex].currentPeriodProjectedStats.appliedStatTotal;
            //console.log("Checking ", boxscorePlayers[playerIndex].player.firstName + " " + boxscorePlayers[playerIndex].player.lastName)

            if (playerScore > player1.points) { player1.points = playerScore; player1.player = boxscorePlayers[playerIndex]; }
            else if (playerScore > player2.points) { player2.points = playerScore; player2.player = boxscorePlayers[playerIndex]; }
            else if (playerScore > player3.points) { player3.points = playerScore; player3.player = boxscorePlayers[playerIndex]; }
          }
        }
      }
    }
  }

  console.log("player 1", player1);
  console.log("player 2", player2);
  console.log("player 3", player3);




  console.log("teams", teams);
};
