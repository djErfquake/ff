
let teams = [];
$.getJSON('teams.json', function(data) {
  teams = data;
  console.log("teams", teams);

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

  /*
  let topScoringTeam = teams[0];
  for (let i = 1; i < teams.length; i++) {
    if (teams[i].points > topScoringTeam.points) { topScoringTeam = teams[i]; }
  }
  $('.top-scoring-team').html('The top scoring team is ' + generateTeamName(topScoringTeam));

  teams[2].points = 52;
  */

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

});


let generateTeamName = function(team) {
  return team.name + "\n(" + team.person + ")";
}
