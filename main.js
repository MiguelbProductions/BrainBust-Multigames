const express = require("express")
const bodyParser = require("body-parser")
const path = require("path")
const { MongoClient } = require("mongodb");
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express()

const dbUrl = 'mongodb://localhost:27017';
const dbName = "BrainBurst";

app.engine("html", require("ejs").renderFile)
app.set("view engine", "html")
app.use("/public", express.static(path.join(__dirname, "public")))
app.set("views", path.join(__dirname, "/views"))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(session({
  secret: 'SECRETKEY',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}))

app.get("/:page?", (req, res) => {
  const page = req.params.page || "Home";
  
  res.render(`${page}.html`, { currentPage: page }, (err, html) => {
      if (err) { res.render("404.html", { currentPage: page });
      } else { res.send(html); }
  });
});

app.post('/login', async (req, res) => {
  const { username_or_email, passwordvalue } = req.body;

  try {
      const client = await MongoClient.connect(dbUrl);
      const db = client.db(dbName);
      const users = db.collection("Users");

      const user = await users.findOne({ $or: [{ username: username_or_email }, { email: username_or_email }] });

      if (!user) {
          res.render('login', { debug: {success: "", error: 'User not finded'}, currentPage: 'login' });
          return;
      }

      if (passwordvalue !== user.password) {
          res.render('login', { debug: {success: "", error: 'Incorrect Password'}, currentPage: 'login' });
          return;
      }

      req.session.userId = user._id;
      res.redirect('/');
  } catch (err) {
      console.error(err);
      res.render('login', { debug: {success: "", error: 'Error acessing users'}, currentPage: 'login' });
  }
}).post('/register', async (req, res) => {
  const { email, name, username, password_field, confirm_password } = req.body;

    if(password_field !== confirm_password) {
        return res.render('register', { debug: {success: "", error: 'Passwords do not match'}, currentPage: 'register' });
    }

    try {
      const client = await MongoClient.connect(dbUrl, { useUnifiedTopology: true });
      const db = client.db(dbName);
      const users = db.collection("Users");

      const existingUser = await users.findOne({ $or: [{ email }, { username }] });
      if(existingUser) {
          return res.render('register', { debug: {success: "", error: 'Email or username already exists'}, currentPage: 'register' });
      }

      const hashedPassword = await bcrypt.hash(password_field, 10);

      await users.insertOne({
          email,
          name,
          username,
          password: hashedPassword, 
      });
      res.redirect('/login', { debug: {success: "User create sucefully", error: ''} , currentPage: 'login' });
  } catch (err) {
      console.error(err);
      res.render('register', { debug: {success: "", error: 'Error accessing the database'} , currentPage: 'register' });
  }
});


app.get('/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) {
          console.error(err);
          res.send('Error');
      } else {
          res.redirect('..');
      }
  });
});



const PORT = 7001
app.listen(PORT, () => {
    console.log(`Brain Burst running on Page http://localhost:${PORT}`)
})
