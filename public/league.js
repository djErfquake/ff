let currentGameWeek = 0;
let totalGameWeeks = 13;

let teams;
let trophies = [];
$.getJSON('teams.json', function(data) {
  teams = data;
  console.log("teams", teams);
  drawTeamScoresGraph();

  // loop through teams
  Object.keys(teams).map(function(teamKey, teamIndex) {
    let team = teams[teamKey];

    // do once
    if (teamIndex == 0) {
      totalGameWeeks = team.games.length;
      for (let i = 0; i < totalGameWeeks; i++) {
        if (team.games[i].score == 0 && team.games[i].opponentScore == 0) {
          currentGameWeek = i - 1;

          // set season progress
          let seasonPercentage = (currentGameWeek + 1 / totalGameWeeks) * 100;
          console.log("seasonPercentage", seasonPercentage);
          $('.season-progress').css('width', seasonPercentage.toString() + "%");

          break;
        }
      }
    }


    // set scores
    $('.player-score-' + teamIndex).html(team.games[currentGameWeek].score.toString());


    drawTeamGraph(team, teamIndex);
  });
});


let drawTeamGraph = function(team, teamIndex) {

  $('.player-name-' + teamIndex.toString()).html(generateTeamName(team));

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

  let chartContext = '.player-chart-' + teamIndex.toString();
  //console.log("chartContext", chartContext);
  //console.log("chart info", data);
  let doughnutChart = new Chart($('.player-chart-' + teamIndex.toString()), {
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
  return team.name + "\n(" + team.person + ")";
};











$.getJSON('trophies.json', function(data) {
  trophies = data;
  console.log("trophies", trophies);

  $('.trophy-most-points-weekly-winner').html(trophies[0].weeks[0].team);
  $('.trophy-most-points-weekly-summary').html(trophies[0].description);
  $('.trophy-most-points-weekly-score').html(trophies[0].weeks[0].points);

  $('.trophy-most-points-overall-winner').html(trophies[0].best.team);
  $('.trophy-most-points-overall-summary').html(trophies[0].description);
  $('.trophy-most-points-overall-score').html(trophies[0].best.points);
});
