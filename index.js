const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require("body-parser");
const mongoose = require('mongoose')


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: String,
});

const ExerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
});




const User = mongoose.model("User", UserSchema);
const Exercise = mongoose.model("Exercise", ExerciseSchema);


app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
app.use(cors())
app.use(express.static('public'))


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', (req, res) => {
    User.find().then(function(data){
      res.send(data)
  })
});

app.get('/api/users/:_id/logs', (req, res) => {
  const opt = {
    from: new Date(req.query.from),
    to: new Date(req.query.to),
    limit: parseInt(req.query.limit)
  }
  
  User.findById(req.params._id).then(function (userData) {
    if(!userData) {
      res.send("Invalid User")
    } 
    
    Exercise.find({username: userData.username}).then(function (exerciseData){
      let logs = {
        username: userData.username,
        _id: userData._id,
        count: 0,
        log: [],
      }
      for (let e of exerciseData){
        const ex = {
          description: e.description,
          duration: e.duration,
          date: e.date,
        }
        let date = new Date(e.date);
        if (opt.limit > logs.log.length || isNaN(opt.limit)){
          if( (date >= opt.from && date <= opt.to) || ( opt.to == "Invalid Date" && opt.from == "Invalid Date")){
            logs.log.push(ex);
          }
        }
      }
      logs.count = logs.log.length;
      res.json(logs);
    })
  })
});

app.post('/api/users', (req, res) => {
  const name = req.body.username
  //check if username exists and return json
  const existingUser = User.findOne({username: name}).then(function(data){
    if (data){
      res.json({username: data.username, _id: data._id})
    } else{
  //if not create and return json
      const newUser = User({username: name})
      newUser.save().then(function (data){
        res.json({username: data.username, _id: data._id})
      })
    }
  });
});


app.post('/api/users/:_id/exercises', (req, res) => {
  let exercise = req.body;
  
  //search the user from id
  User.findById(req.params._id).then(function (userData) {
    //if found add exercise
    if(!userData.username){
      res.send("user not found")
    } else {
      let date = new Date(exercise.date)
      if(date == "Invalid Date"){
        date = new Date(Date.now())
      }
      const newExercise = Exercise({
        username: userData.username,
        description: exercise.description,
        duration: exercise.duration,
        date: date.toDateString()
      })
      newExercise.save().then(function (exerciseData){
        const a = {
          username: userData.username,
          _id: userData._id,
          description: exerciseData.description,
          duration: exerciseData.duration,
          date: exerciseData.date
        }
        res.json(a);
      })
    }
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
