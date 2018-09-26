const ESPN_LEAGUE_ID = "1081893";
const YEAR = "2018";

let teams;
let players = [];

let totalGameWeeks = 13;
let currentGameWeek = 0;


$.getJSON('https://games.espn.com/ffl/api/v2/teams?leagueId=' + ESPN_LEAGUE_ID, function(teamsData) {

  // sort teams by number of points scored
  teams = teamsData.teams;

  $.getJSON('https://games.espn.com/ffl/api/v2/scoreboard?leagueId=' + ESPN_LEAGUE_ID, function(scoreboardData) {

    console.log("scoreboardData", scoreboardData);

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

  for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
    for (let gameWeekIndex = 0; gameWeekIndex < currentGameWeek; gameWeekIndex++) {
      let boxscore = teams[teamIndex].boxscores[gameWeekIndex];

      if (teams[teamIndex].scheduleItems[gameWeekIndex].matchups[0].awayTeam.teamAbbrev == teams[teamIndex].teamAbbrev) {
        teams[teamIndex].scheduleItems[gameWeekIndex].score = teams[teamIndex].scheduleItems[gameWeekIndex].matchups[0].awayTeamScores[0];
        teams[teamIndex].scheduleItems[gameWeekIndex].opponentScore = teams[teamIndex].scheduleItems[gameWeekIndex].matchups[0].homeTeamScores[0];
      } else {
        teams[teamIndex].scheduleItems[gameWeekIndex].score = teams[teamIndex].scheduleItems[gameWeekIndex].matchups[0].homeTeamScores[0];
        teams[teamIndex].scheduleItems[gameWeekIndex].opponentScore = teams[teamIndex].scheduleItems[gameWeekIndex].matchups[0].awayTeamScores[0];
      }


      for (let matchupTeamIndex = 0; matchupTeamIndex < 2; matchupTeamIndex++) {

        let boxscorePlayers = boxscore.teams[matchupTeamIndex].slots;
        for (let playerIndex = 0; playerIndex < boxscorePlayers.length; playerIndex++) {

          if (boxscorePlayers[playerIndex].currentPeriodRealStats != undefined) {

            let playerId = boxscorePlayers[playerIndex].player.playerId;
            let playerScore = boxscorePlayers[playerIndex].currentPeriodRealStats.appliedStatTotal;
            if (playerScore != undefined) {
              if (players[playerId] == undefined) {
                players[playerId] = boxscorePlayers[playerIndex];
                players[playerId].totalScore = 0;
                players[playerId].games = [];
                players[playerId].owner = boxscore.teams[matchupTeamIndex].teamId;
              }

              if (players[playerId].games[gameWeekIndex] ==  undefined) {
                players[playerId].games[gameWeekIndex] = playerScore;
                players[playerId].totalScore += playerScore;
              }

              //console.log("Checking ", boxscorePlayers[playerIndex].player.firstName + " " + boxscorePlayers[playerIndex].player.lastName, boxscorePlayers[playerIndex].currentPeriodRealStats.appliedStatTotal, boxscorePlayers[playerIndex]);
            }
          }
        }
      }
    }
  }

  // sort players by number of points scored this week
  let weekPlayers = copy(players);
  weekPlayers.sort(function(a,b) {return (a.games[currentGameWeek - 1] < b.games[currentGameWeek - 1]) ? 1 : ((b.games[currentGameWeek - 1] < a.games[currentGameWeek - 1]) ? -1 : 0);} );

  //sort players by number of points score over the whole season
  players.sort(function(a,b) {return (a.totalScore < b.totalScore) ? 1 : ((b.totalScore < a.totalScore) ? -1 : 0);} );

  // sort teams by number of points scored this week
  let weekTeams = copy(teams);
  weekTeams.sort(function(a,b) {return (a.scheduleItems[currentGameWeek - 1].score < b.scheduleItems[currentGameWeek - 1].score) ? 1 : ((b.scheduleItems[currentGameWeek - 1].score < a.scheduleItems[currentGameWeek - 1].score) ? -1 : 0);} );
  console.log("best teams this week", weekTeams);

  // sort teams by number of points score over the whole season
  teams.sort(function(a,b) {return (a.record.pointsFor < b.record.pointsFor) ? 1 : ((b.record.pointsFor < a.record.pointsFor) ? -1 : 0);} );
  console.log("best teams this season", teams);

  // drag graphs
  drawWeeklyPlayerTrophyGraph(weekPlayers[0], weekPlayers[1], weekPlayers[2]);
  drawSeasonPlayerTrophyGraph(players[0], players[1], players[2]);
  drawWeeklyTeamTrophyGraph(weekTeams[0], weekTeams[1], weekTeams[2]);
  drawSeasonTeamTrophyGraph(teams[0], teams[1], teams[2]);

  $.getJSON('https://games.espn.com/ffl/api/v2/scoreboard?leagueId=' + ESPN_LEAGUE_ID + '&matchupPeriodId=' + currentGameWeek, function(scoreboardData) {
    console.log("scoreboardData", scoreboardData);
  });
};



let drawMatchupInfo = function(team, domIndex) {

  //console.log("player 1", player1);
  //console.log("player 2", player2);
  //console.log("player 3", player3);

  // best player
  let bestPlayerName = generatePlayerName(player1.player);
  let bestPlayerId = player1.player.sportsId;
  let bestPlayerImageUrl = "http://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/" + bestPlayerId + ".png&w=200&h=145";
  let bestPlayerTeam = getTeamFromTeamId(player1.owner);
  $('.best-player-week-picture').css('background-image', "url('" + bestPlayerImageUrl + "')");
  $('.best-player-week-name').html(bestPlayerName + "<br>" + generateTeamName(bestPlayerTeam));

  // draw graph
  let data = { datasets: [{data:[], backgroundColor:[]}], labels: [] };
  data.labels.push(bestPlayerName);
  data.datasets[0].data.push(player1.games[currentGameWeek - 1]);
  data.datasets[0].backgroundColor.push(getColorFromPosition(player1.player.eligibleSlotCategoryIds[0]));
  data.labels.push(generatePlayerName(player2.player));
  data.datasets[0].data.push(player2.games[currentGameWeek - 1]);
  data.datasets[0].backgroundColor.push(getColorFromPosition(player2.player.eligibleSlotCategoryIds[0]));
  data.labels.push(generatePlayerName(player3.player));
  data.datasets[0].data.push(player3.games[currentGameWeek - 1]);
  data.datasets[0].backgroundColor.push(getColorFromPosition(player3.player.eligibleSlotCategoryIds[0]));
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
            suggestedMax: player1.games[currentGameWeek - 1] + 3
          }
        }]
      }
    }
  });


};




let drawWeeklyPlayerTrophyGraph = function(player1, player2, player3) {

  //console.log("player 1", player1);
  //console.log("player 2", player2);
  //console.log("player 3", player3);

  // best player
  let bestPlayerName = generatePlayerName(player1.player);
  let bestPlayerId = player1.player.sportsId;
  let bestPlayerImageUrl = "http://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/" + bestPlayerId + ".png&w=200&h=145";
  let bestPlayerTeam = getTeamFromTeamId(player1.owner);
  $('.best-player-week-picture').css('background-image', "url('" + bestPlayerImageUrl + "')");
  $('.best-player-week-name').html(bestPlayerName + "<br>" + generateTeamName(bestPlayerTeam));

  // draw graph
  let data = { datasets: [{data:[], backgroundColor:[]}], labels: [] };
  data.labels.push(bestPlayerName);
  data.datasets[0].data.push(player1.games[currentGameWeek - 1]);
  data.datasets[0].backgroundColor.push(getColorFromPosition(player1.player.eligibleSlotCategoryIds[0]));
  data.labels.push(generatePlayerName(player2.player));
  data.datasets[0].data.push(player2.games[currentGameWeek - 1]);
  data.datasets[0].backgroundColor.push(getColorFromPosition(player2.player.eligibleSlotCategoryIds[0]));
  data.labels.push(generatePlayerName(player3.player));
  data.datasets[0].data.push(player3.games[currentGameWeek - 1]);
  data.datasets[0].backgroundColor.push(getColorFromPosition(player3.player.eligibleSlotCategoryIds[0]));
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
            suggestedMax: player1.games[currentGameWeek - 1] + 3
          }
        }]
      }
    }
  });


};


let drawSeasonPlayerTrophyGraph = function(player1, player2, player3) {

  console.log("player 1", player1);
  console.log("player 2", player2);
  console.log("player 3", player3);

  // best player
  let bestPlayerName = generatePlayerName(player1.player);
  let bestPlayerId = player1.player.sportsId;
  let bestPlayerImageUrl = "http://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/" + bestPlayerId + ".png&w=200&h=145";
  let bestPlayerTeam = getTeamFromTeamId(player1.owner);
  $('.best-player-season-picture').css('background-image', "url('" + bestPlayerImageUrl + "')");
  $('.best-player-season-name').html(bestPlayerName + "<br>" + generateTeamName(bestPlayerTeam));

  // draw graph
  let data = { datasets: [{data:[], backgroundColor:[]}], labels: [] };
  console.log("chart data", data);
  data.labels.push(bestPlayerName);
  data.datasets[0].data.push(player1.totalScore);
  data.datasets[0].backgroundColor.push(getColorFromPosition(player1.player.eligibleSlotCategoryIds[0]));
  data.labels.push(generatePlayerName(player2.player));
  data.datasets[0].data.push(player2.totalScore);
  data.datasets[0].backgroundColor.push(getColorFromPosition(player2.player.eligibleSlotCategoryIds[0]));
  data.labels.push(generatePlayerName(player3.player));
  data.datasets[0].data.push(player3.totalScore);
  data.datasets[0].backgroundColor.push(getColorFromPosition(player3.player.eligibleSlotCategoryIds[0]));
  let barChart = new Chart($('.best-player-season-chart'), {
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
            suggestedMax: player1.totalScore + 3
          }
        }]
      }
    }
  });


};




let drawWeeklyTeamTrophyGraph = function(team1, team2, team3) {

  // best team
  let bestTeamName = generateTeamName(team1);
  $('.best-team-week-picture').css('background-image', "url('" + team1.logoUrl + "')");
  $('.best-team-week-name').html(bestTeamName);

  // draw graph
  let data = { datasets: [{data:[], backgroundColor:[]}], labels: [] };
  data.labels.push(bestTeamName);
  data.datasets[0].data.push(team1.scheduleItems[currentGameWeek - 1].score);
  data.datasets[0].backgroundColor.push('rgba(30, 39, 46, 1.0)');
  data.labels.push(generateTeamName(team2));
  data.datasets[0].data.push(team2.scheduleItems[currentGameWeek - 1].score);
  data.datasets[0].backgroundColor.push('rgba(30, 39, 46, 1.0)');
  data.labels.push(generateTeamName(team3));
  data.datasets[0].data.push(team3.scheduleItems[currentGameWeek - 1].score);
  data.datasets[0].backgroundColor.push('rgba(30, 39, 46, 1.0)');
  let barChart = new Chart($('.best-team-week-chart'), {
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
            suggestedMax: team1.scheduleItems[currentGameWeek - 1].score + 3
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




let copy = function(o) { var output, v, key; output = Array.isArray(o) ? [] : {}; for (key in o) { v = o[key]; output[key] = (typeof v === "object") ? copy(v) : v; } return output; };


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
