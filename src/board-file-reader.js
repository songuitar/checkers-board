var express = require('express')
const fs = require('fs');
const app = express()
const port = 3000


app.get('/', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  const board = JSON.parse(fs.readFileSync('boardState.json'));

  res.json(board)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

