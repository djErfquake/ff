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

    //
    for (let matchupPeriodIndex = 0; matchupPeriodIndex < currentGameWeek; matchupPeriodIndex++) {
      for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
        let teamId = teams[teamIndex].teamId;
        $.getJSON('https://games.espn.com/ffl/api/v2/boxscore?leagueId=' + ESPN_LEAGUE_ID +
        '&matchupPeriodId=' + matchupPeriodIndex +
        '&teamId=' + teamId,
        function(boxscoreData) {
          if (teams[teamIndex].boxscores == undefined) {teams[teamIndex].boxscores = [];}
          teams[teamIndex].boxscores.push(boxscoreData.boxscore);

          /*
          let boxscorePlayers = boxscoreData.boxscore.teams[0].slots;
          for (let playerIndex = 0; playerIndex < boxscorePlayers.length; playerIndex++) {
              teams.players[boxscorePlayers[playerIndex].playerId] = boxscorePlayers[playerIndex];
          }
          */

        });
      }
    }



    console.log("teams", teams);
  });
});
