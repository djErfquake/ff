
let teams = [];
$.getJSON('teams.json', function(data) {
  teams = data;
  console.log("teams", teams);

  let teamNames = [];
  for (let i = 0; i < teams.length; i++) {
    teamNames[i] = generateTeamName(teams[i]);
  }

  let teamScores = [];
  for (let i = 0; i < teams.length; i++) {
    teamScores[i] = teams[i].points;
  }

  let topScoringTeam = teams[0];
  for (let i = 1; i < teams.length; i++) {
    if (teams[i].points > topScoringTeam.points) { topScoringTeam = teams[i]; }
  }
  $('.top-scoring-team').html('The top scoring team is ' + generateTeamName(topScoringTeam));

  teams[2].points = 52;

  let chartContext = $('.chart');
  let testChart = new Chart(chartContext, {
    // The type of chart we want to create
      type: 'bar',

      // The data for our dataset
      data: {
          labels: teamNames,
          datasets: [{
              label: "Week 1 Scores",
              backgroundColor: 'rgb(255, 99, 132)',
              borderColor: 'rgb(255, 99, 132)',
              data: teamScores
          }]
      },

      // Configuration options go here
      options: {}

  });

});


let generateTeamName = function(team) {
  return team.name + "\n(" + team.person + ")";
}
