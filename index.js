const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');

// Basic Configuration
app.use(cors());
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//mongoose
const mongoose = require('mongoose');
const mongoUri = process.env['MONGO_URI']
mongoose.connect(mongoUri, { });

const exSchema = new mongoose.Schema({
    description: String,
    duration: Number,
    date: Date,

});

let Ex = mongoose.model('Ex', exSchema);

const userSchema = new mongoose.Schema({
  username: String,
  log: [exSchema]
  });


let User = mongoose.model('User', userSchema);


app.post('/api/users', async function(req, res) {
  const newuser = await createAndSaveUser(req.body.username);
  return res.json({
                   username: newuser.username,
                   _id: newuser._id
                 })
});

const createAndSaveUser = async (input) => {
  const newuser = new User({
    username: input
  });
  await newuser.save();
  console.log('ID:',newuser.id, 'Created');
  return newuser;
};

const createAndSaveEx = async (id,desc,dur,date) => {
  
  const usr = await User.findById(id);
  console.log("User found:", usr.username)
  console.log("Creating:",desc,dur,date)  
  const newex = new Ex({
                          description: desc,
                          duration: dur,
                          date: date,
                          
                      });
  newex.save();
  logEx(usr, newex);
  let response = {
      _id: usr._id,
      username: usr.username,
      date: date.toDateString(),
      duration: dur,
      description: desc,
      
    }

  return response;
};

const logEx = async (usr, newex) => {
  await usr.log.push(newex);
  await usr.save();
    
};

app.get('/api/users', async (req, res) => {
  const all = await User.find({},"username _id");
  const response = 
  res.send(all);
});

app.post('/api/users/:_id/exercises', async function(req, res) {
  let newdate = new Date();
  req.body.date ? newdate = new Date(req.body.date) : null

  console.log("New Ex:",req.params._id, 
     req.body.description, 
     req.body.duration, 
     newdate)
  
  const newex = await createAndSaveEx(req.params._id, 
                                      req.body.description, 
                                      parseInt(req.body.duration), 
                                      newdate);
  
  return res.json(newex)
});

app.get('/api/users/:_id/exercises', async (req, res) => {
  const all = await User.find({},"username _id");
  res.send(all);
});

app.get('/api/users/:_id/logs?', async (req, res) => {

  let from = new Date(0);
  let to = new Date();
  req.query.from ? from = new Date(req.query.from) : null;
  req.query.to ? to = new Date(req.query.to) : null
  
  
  const usr = await User.findById(req.params._id);
  let limit = usr.log.length
  req.query.limit ? limit = req.query.limit : null
    
  const logs = usr.log.filter(obj => {
                          return obj.date > from;})
                      .filter(obj => {
                          return obj.date < to;})
                      .map(obj => { return {
        description: obj.description,
        duration: obj.duration,
        date: obj.date.toDateString()
      };
    });

    res.json({
             username: usr.username,
             count: usr.log.length,
             _id: usr._id,
             log: logs.slice(0, limit)
           });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
