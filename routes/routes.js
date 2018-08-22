const express = require('express');
const path = require('path');
let router = express.Router();

router.get('/', (req, res) => {
  res.status(200).sendFile(path.resolve(__dirname, '../', 'public', 'league.html'));
});

router.get('/calvin', (req, res) => {
  res.status(200).sendFile(path.resolve(__dirname, '../', 'public', 'calvin.html'));
});


module.exports = router;
