let currentGameWeek = 0;
let totalGameWeeks = 13;

let teams;
let trophies = [];
let matchups = [];

$.getJSON('teams.json', function(data) {
  teams = data;
  console.log("teams", teams);
  //drawTeamScoresGraph();

  // loop through teams
  Object.keys(teams).map(function(teamKey, teamIndex) {
    let team = teams[teamKey];

    // do once
    if (teamIndex == 0) {
      totalGameWeeks = team.games.length;
      for (let i = 0; i < totalGameWeeks; i++) {
        if (team.games[i].score == 0 && team.games[i].opponentScore == 0) {
          currentGameWeek = i - 1;
          console.log("currentGameWeek", currentGameWeek);

          // set season progress
          let seasonPercentage = ((currentGameWeek + 1) / totalGameWeeks) * 100;
          console.log("seasonPercentage", seasonPercentage);
          $('.season-progress').css('width', seasonPercentage.toString() + "%");

          break;
        }
      }
    }

    // get matchup info
    let matchupAdded = false;
    for (let i = 0; i < matchups.length; i++) {
      for (let j = 0; j < matchups[i].players.length; j++) {
        if (matchups[i].players[j].abbrev == team.abbrev) {
          matchupAdded = true;
          break;
    }}}

    if (!matchupAdded) {
      matchups.push({
        players: [getTeamFromAbbrev(team.abbrev), getTeamFromAbbrev(team.games[currentGameWeek].opponent)],
        scores: [team.games[currentGameWeek].score, team.games[currentGameWeek].opponentScore]
      })
    }

  });

  // do matchups
  matchups.sort(function(a,b) {return (a.scores[0] + a.scores[1] < b.scores[0] + b.scores[1]) ? 1 : ((b.scores[0] + b.scores[1] < a.scores[0] + a.scores[1]) ? -1 : 0);} );
  for (let i = 0; i < matchups.length; i++) {
    drawTeamGraph(matchups[i].players[0], i * 2);
    drawTeamGraph(matchups[i].players[1], (i * 2) + 1);
  }


  // LOAD TROPHY INFO
  $.getJSON('trophies.json', function(data) {
    trophies = data;
    console.log("trophies", trophies);

    drawPlayerTrophyGraph("best-player-week", trophies["best-player"]["weeks"][currentGameWeek]);
    drawPlayerTrophyGraph("best-player-season", trophies["best-player"]["best"]);

    drawTeamTrophyGraph("best-team-week", trophies["best-team"]["weeks"][currentGameWeek]);
    drawTeamTrophyGraph("best-team-season", trophies["best-team"]["best"]);
  });
});





let drawTeamGraph = function(team, domIndex) {

  $('.player-name-' + domIndex.toString()).html(generateTeamName(team));
  $('.player-score-' + domIndex).html(team.games[currentGameWeek].score.toString());

  let data = {
    datasets: [{data:[], backgroundColor:[]}],
    labels: []
  };

  Object.keys(team.players).map(function(playerKey, playerIndex) {
    //console.log("Player: " + playerKey);
    let player = team.players[playerKey];
    data.labels.push(player.name + "\n(" + player.position + ")");
    if (player.scores[currentGameWeek] <= 0) { data.datasets[0].data.push(0); }
    else { data.datasets[0].data.push(player.scores[currentGameWeek]); }
    data.datasets[0].backgroundColor.push(getColorFromPosition(player.position));
  });

  let chartContext = '.player-chart-' + domIndex.toString();
  //console.log("chartContext", chartContext);
  //console.log("chart info", data);
  let doughnutChart = new Chart($('.player-chart-' + domIndex.toString()), {
    type: 'doughnut',
    data: data,
    options: {
      legend: {
        display: false,
        position: 'bottom'
      },
      cutoutPercentage: 60, // 50
      rotation: 0.2,
      animation: {
        animateRotate: true,
        animateScale: true
      }
    }
  });
};



let drawPlayerTrophyGraph = function(domName, info1) {

  //$("." + domName + "-name").html(info1.player.name + "<br>" + generateTeamName(getTeamFromAbbrev(info1.team)));
  let data = {
    datasets: [{data:[], backgroundColor:[]}],
    labels: []
  };

  $.getJSON('http://games.espn.com/ffl/api/v2/playerInfo?playerId=' + info1.player.espnIndex + '&leagueId=1081893', function(playerInfo) {
    console.log("Best Player", playerInfo);
    let espnImageId = playerInfo.playerInfo.players[0].player.sportsId;
    let bestPlayerImageUrl = "http://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/" + espnImageId + ".png&w=200&h=145";
    $("." + domName + "-picture").css('background-image', "url('" + bestPlayerImageUrl + "')");
    $("." + domName + "-name").html(playerInfo.playerInfo.players[0].player.firstName + " " + playerInfo.playerInfo.players[0].player.lastName + "<br>" + playerInfo.playerInfo.players[0].team.teamLocation + " " + playerInfo.playerInfo.players[0].team.teamNickname);
  });


  data.labels.push(info1.player.name);

  data.datasets[0].data.push(info1.points);

  data.datasets[0].backgroundColor.push(getColorFromPosition(info1.player.position));

  let barChart = new Chart($("." + domName + "-chart"), {
    type: 'bar',
    data: data,
    options: {
      legend: {
        display: false,
        position: 'bottom'
      },
      animation: {
        animateScale: true
      }
    }
  });

};


let drawTeamTrophyGraph = function(domName, info1) {

  let data = {
    datasets: [{data:[], backgroundColor:[]}],
    labels: []
  };

  $.getJSON('http://games.espn.com/ffl/api/v2/teams?leagueId=1081893', function(teamsInfo) {
    let team = undefined;
    for (let i = 0; i < teamsInfo.teams.length; i++) {
      if (teamsInfo.teams[i].teamAbbrev == info1.team) { team = teamsInfo.teams[i]; break; }
    }
    console.log("Best Team", team, info1);

    $("." + domName + "-picture").css('background-image', "url('" + team.logoUrl + "')");

    let teamName = team.teamLocation + " " + team.teamNickname;
    $("." + domName + "-name").html(teamName);


    data.labels.push(teamName);

    data.datasets[0].data.push(info1.points);

    data.datasets[0].backgroundColor.push('rgba(72, 84, 96, 1.0)');

    let barChart = new Chart($("." + domName + "-chart"), {
      type: 'bar',
      data: data,
      options: {
        legend: {
          display: false,
          position: 'bottom'
        },
        animation: {
          animateScale: true
        }
      }
    });
  });

};


let drawTeamScoresGraph = function() {
  let datasets = [];
  let teamNames = [];
  let labels = [];
  let scores = [];
  let colors = [
    'rgba(255, 159, 243,1.0)',
    'rgba(254, 202, 87,1.0)',
    'rgba(255, 107, 107,1.0)',
    'rgba(72, 219, 251,1.0)',
    'rgba(29, 209, 161,1.0)',
    'rgba(0, 210, 211,1.0)',
    'rgba(84, 160, 255,1.0)',
    'rgba(95, 39, 205,1.0)',
    'rgba(87, 101, 116,1.0)',
    'rgba(34, 47, 62,1.0)',
    'rgba(245, 59, 87,1.0)',
    'rgba(255, 168, 1,1.0)',
    'rgba(255, 63, 52,1.0)',
    'rgba(15, 188, 249,1.0)'
  ]
  Object.keys(teams).map(function(key, i) {

    let team = teams[key];

    teamNames[i] = generateTeamName(team);
    scores[i] = [];
    for (let j = 0; j < team.games.length; j++) {
      labels[j] = "Week " + (j + 1).toString();
      scores[i][j] = team.games[j].score;
    }

    datasets[i] = {
      label: teamNames[i],
      borderColor: colors[i],
      data: scores[i]
    };
  });

  let chartContext = $('.chart');
  let testChart = new Chart(chartContext, {
    // The type of chart we want to create
      type: 'line',

      // The data for our dataset
      data: {
          labels: labels,
          datasets: datasets
      },

      // Configuration options go here
      options: {}

  });
};


let getColorFromPosition = function(position) {
  let color = 'rgba(72, 84, 96, 1.0)'; // grey
  if (position == "QB") { color = 'rgba(245, 59, 87, 1.0)'; } // red
  else if (position == "RB") { color = 'rgba(87, 95, 207, 1.0)'; } // periwinkle
  else if (position == "WR") { color = 'rgba(11, 232, 129, 1.0)'; } // green
  else if (position == "FLEX") { color = 'rgba(52, 231, 228, 1.0)'; } // turquoise
  else if (position == "TE") { color = 'rgba(15, 188, 249, 1.0)'; } // yellow
  else if (position == "D/ST") { color = 'rgba(30, 39, 46, 1.0)'; } // black
  else if (position == "K") { color = 'rgba(255, 221, 89, 1.0)'; } // blue
  else if (position == "P") { color = 'rgba(255, 192, 72, 1.0)'; } // orange
  return color;
};


let generateTeamName = function(team) {
  return team.name + "<br>(" + team.person + ")";
};


let getTeamFromAbbrev = function(abbrev) {
  let foundTeam = undefined;
  Object.keys(teams).map(function(key) {
    let team = teams[key];
    if (team.abbrev == abbrev) { foundTeam = team; }
  });
  return foundTeam;
}
