const express = require("express");
const bodyParser = require("body-parser");
const { addTask1, addTask2 } = require("./queue");
const path = require('path');

const app = express();
app.use(bodyParser.json());
const PORT = 3000;

// Add task1 (string)
app.post("/task1", async (req, res) => {
  const { message } = req.body;
  // console.log("add message", message)
  await addTask1(message);
  res.send("Task1 added");
});

// Add task2 (object)
app.post("/task2", async (req, res) => {
  const { obj } = req.body;
  await addTask2(obj);
  res.send("Task2 added");
});
// Serve file HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
