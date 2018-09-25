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
          teams[teamIndex].boxscores[matchupPeriodIndex].teamId = teamId;

          matchupsAdded++;
          //console.log(matchupsAdded + "/" + totalMatchups);
          if (matchupsAdded == totalMatchups) { analyzeData(); }
        });
      }
    }



  });
});


let analyzeData = function() {

  let weeklyPlayer1 = { points: 0, player: {player: { playerId: 0} } };
  let weeklyPlayer2 = { points: 0, player: {player: { playerId: 0} } };
  let weeklyPlayer3 = { points: 0, player: {player: { playerId: 0} } };
  let seasonPlayer1 = { points: 0, player: {player: { playerId: 0} } };
  let seasonPlayer2 = { points: 0, player: {player: { playerId: 0} } };
  let seasonPlayer3 = { points: 0, player: {player: { playerId: 0} } };

  for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
    for (let gameWeekIndex = 0; gameWeekIndex < currentGameWeek; gameWeekIndex++) {
      let boxscore = teams[teamIndex].boxscores[gameWeekIndex];

      for (let matchupTeamIndex = 0; matchupTeamIndex < 2; matchupTeamIndex++) {

        let boxscorePlayers = boxscore.teams[matchupTeamIndex].slots;
        for (let playerIndex = 0; playerIndex < boxscorePlayers.length; playerIndex++) {

          if (boxscorePlayers[playerIndex].currentPeriodRealStats != undefined) {
            let playerScore = boxscorePlayers[playerIndex].currentPeriodRealStats.appliedStatTotal;
            //console.log("Checking ", boxscorePlayers[playerIndex].player.firstName + " " + boxscorePlayers[playerIndex].player.lastName, boxscorePlayers[playerIndex].currentPeriodRealStats.appliedStatTotal, boxscorePlayers[playerIndex]);

            // TODO: Add to each players total score (keep a dictionary of all players)


            if (gameWeekIndex == currentGameWeek - 1) {
              // weekly player
              if (playerScore > weeklyPlayer1.points &&
                weeklyPlayer1.player.player.playerId != boxscorePlayers[playerIndex].player.playerId) {
                  weeklyPlayer1.points = playerScore; weeklyPlayer1.player = boxscorePlayers[playerIndex]; weeklyPlayer1.teamId = boxscore.teamId;
                }
              else if (playerScore > weeklyPlayer2.points &&
                weeklyPlayer1.player.player.playerId != boxscorePlayers[playerIndex].player.playerId &&
                weeklyPlayer2.player.player.playerId != boxscorePlayers[playerIndex].player.playerId) {
                  weeklyPlayer2.points = playerScore; weeklyPlayer2.player = boxscorePlayers[playerIndex]; weeklyPlayer2.teamId = boxscore.teamId;
                }
              else if (playerScore > weeklyPlayer3.points &&
                weeklyPlayer1.player.player.playerId != boxscorePlayers[playerIndex].player.playerId &&
                weeklyPlayer2.player.player.playerId != boxscorePlayers[playerIndex].player.playerId &&
                weeklyPlayer3.player.player.playerId != boxscorePlayers[playerIndex].player.playerId) {
                  weeklyPlayer3.points = playerScore; weeklyPlayer3.player = boxscorePlayers[playerIndex]; weeklyPlayer3.teamId = boxscore.teamId;
                }

                /*
              // season player
              if (playerScore > seasonPlayer1.points &&
                seasonPlayer1.player.player.playerId != boxscorePlayers[playerIndex].player.playerId) {
                  seasonPlayer1.points = playerScore; seasonPlayer1.player = boxscorePlayers[playerIndex]; seasonPlayer1.teamId = boxscore.teamId;
                }
              else if (playerScore > seasonPlayer2.points &&
                seasonPlayer1.player.player.playerId != boxscorePlayers[playerIndex].player.playerId &&
                seasonPlayer2.player.player.playerId != boxscorePlayers[playerIndex].player.playerId) {
                  seasonPlayer2.points = playerScore; seasonPlayer2.player = boxscorePlayers[playerIndex]; seasonPlayer2.teamId = boxscore.teamId;
                }
              else if (playerScore > seasonPlayer3.points &&
                seasonPlayer1.player.player.playerId != boxscorePlayers[playerIndex].player.playerId &&
                seasonPlayer2.player.player.playerId != boxscorePlayers[playerIndex].player.playerId &&
                seasonPlayer3.player.player.playerId != boxscorePlayers[playerIndex].player.playerId) {
                  seasonPlayer3.points = playerScore; seasonPlayer3.player = boxscorePlayers[playerIndex]; seasonPlayer3.teamId = boxscore.teamId;
                }
                */
            }
          }
        }
      }
    }
  }


  drawWeeklyPlayerTrophyGraph(weeklyPlayer1, weeklyPlayer2, weeklyPlayer3);

  drawSeasonTeamTrophyGraph(teams[0], teams[1], teams[2]);


  console.log("teams", teams);
};




let drawWeeklyPlayerTrophyGraph = function(player1, player2, player3) {

  console.log("player 1", player1);
  //console.log("player 2", player2);
  //console.log("player 3", player3);

  // best player
  let bestPlayerName = generatePlayerName(player1.player.player);
  let bestPlayerId = player1.player.player.sportsId;
  let bestPlayerImageUrl = "http://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/" + bestPlayerId + ".png&w=200&h=145";
  let bestPlayerTeam = getTeamFromTeamId(player1.teamId);
  $('.best-player-week-picture').css('background-image', "url('" + bestPlayerImageUrl + "')");
  $('.best-player-week-name').html(bestPlayerName + "<br>" + generateTeamName(bestPlayerTeam));

  // draw graph
  let data = { datasets: [{data:[], backgroundColor:[]}], labels: [] };
  data.labels.push(bestPlayerName);
  data.datasets[0].data.push(player1.points);
  data.datasets[0].backgroundColor.push(getColorFromPosition(player1.player.player.eligibleSlotCategoryIds[0]));
  data.labels.push(generatePlayerName(player2.player.player));
  data.datasets[0].data.push(player2.points);
  data.datasets[0].backgroundColor.push(getColorFromPosition(player2.player.player.eligibleSlotCategoryIds[0]));
  data.labels.push(generatePlayerName(player3.player.player));
  data.datasets[0].data.push(player3.points);
  data.datasets[0].backgroundColor.push(getColorFromPosition(player3.player.player.eligibleSlotCategoryIds[0]));
  let barChart = new Chart($('.best-player-week-chart'), {
    type: 'bar',
    data: data,
    options: {
      legend: {
        display: false,
        position: 'bottom'
      },
      animation: {
        animateScale: true
      },
      scales: {
        yAxes: [{
          ticks: {
            suggestedMin: 0,
            suggestedMax: player1.points + 3
          }
        }]
      }
    }
  });


};



let drawSeasonTeamTrophyGraph = function(team1, team2, team3) {

  // best team
  let bestTeamName = generateTeamName(team1);
  $('.best-team-season-picture').css('background-image', "url('" + team1.logoUrl + "')");
  $('.best-team-season-name').html(bestTeamName);

  // draw graph
  let data = { datasets: [{data:[], backgroundColor:[]}], labels: [] };
  data.labels.push(bestTeamName);
  data.datasets[0].data.push(team1.record.pointsFor);
  data.datasets[0].backgroundColor.push('rgba(30, 39, 46, 1.0)');
  data.labels.push(generateTeamName(team2));
  data.datasets[0].data.push(team2.record.pointsFor);
  data.datasets[0].backgroundColor.push('rgba(30, 39, 46, 1.0)');
  data.labels.push(generateTeamName(team3));
  data.datasets[0].data.push(team3.record.pointsFor);
  data.datasets[0].backgroundColor.push('rgba(30, 39, 46, 1.0)');
  let barChart = new Chart($('.best-team-season-chart'), {
    type: 'bar',
    data: data,
    options: {
      legend: {
        display: false,
        position: 'bottom'
      },
      animation: {
        animateScale: true
      },
      scales: {
        yAxes: [{
          ticks: {
            suggestedMin: 0,
            suggestedMax: team1.record.pointsFor + 3
          }
        }]
      }
    }
  });

};





let getTeamFromTeamId = function(teamId) {
  let foundTeam = undefined;
  Object.keys(teams).map(function(key) {
    let team = teams[key];
    if (team.teamId == teamId) { foundTeam = team; }
  });
  return foundTeam;
};

let generateTeamName = function(team) {
  return team.teamLocation + " " + team.teamNickname + " (" + team.teamAbbrev + ")";
};

let generatePlayerName = function(player) {
  return player.firstName + " " + player.lastName;
};


let getColorFromPosition = function(position) {
  let color = 'rgba(72, 84, 96, 1.0)'; // grey
  if (position == 0) { color = 'rgba(245, 59, 87, 1.0)'; } // QB red
  else if (position == 2) { color = 'rgba(87, 95, 207, 1.0)'; } // RB periwinkle
  else if (position == 4) { color = 'rgba(11, 232, 129, 1.0)'; } // WR green
  else if (position == 23) { color = 'rgba(52, 231, 228, 1.0)'; } // FLEX turquoise
  else if (position == 6) { color = 'rgba(15, 188, 249, 1.0)'; } // TE yellow
  else if (position == 16) { color = 'rgba(30, 39, 46, 1.0)'; } // D/ST black
  else if (position == 17) { color = 'rgba(255, 221, 89, 1.0)'; } // K blue
  else if (position == "P") { color = 'rgba(255, 192, 72, 1.0)'; } // P orange
  return color;
};
