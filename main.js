const express = require("express")
const bodyParser = require("body-parser")
const path = require("path")
const { MongoClient, ObjectId } = require("mongodb");
const session = require('express-session');
const bcrypt = require('bcrypt');
const fileUpload = require('express-fileupload');

const app = express()

const dbUrl = 'mongodb://localhost:27017';
const dbName = "BrainBurst";

app.engine("html", require("ejs").renderFile)
app.set("view engine", "html")
app.use("/public", express.static(path.join(__dirname, "public")))
app.set("views", path.join(__dirname, "/views"))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(fileUpload());

app.use(session({
  secret: 'SECRETKEY',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}))

app.get("/:page?", async (req, res) => {
  const page = req.params.page || "Home";
  let user = null;

  if (req.session.userId) {
    try {
      const client = await MongoClient.connect(dbUrl);
      const db = client.db(dbName);
      const users = db.collection("Users");

      const userId = new ObjectId(req.session.userId);

      user = await users.findOne({ _id: userId });
      if (user) user.password = undefined
    } catch (err) {
      console.error(err);
    }
  }
  
  res.render(`${page}.html`, { currentPage: page, user: user }, (err, html) => {
      if (err)res.render("404.html", { currentPage: page, user: user });
      else res.send(html)
  })
});

app.get("/auth/:page?", (req, res) => {
  const page = req.params.page || "Home";
  const successMessage = req.query.success || '';
  
  res.render(`${page}.html`, { debug: { success: successMessage }, fields: {} }, (err, html) => {
      if (err) res.redirect("/404");
      else res.send(html)
  });
});

app.post('/auth/login', async (req, res) => {
  const { username_or_email, passwordvalue } = req.body;
  let errors = {};

  try {
    const client = await MongoClient.connect(dbUrl);
    const db = client.db(dbName);
    const users = db.collection("Users");

    const user = await users.findOne({ $or: [{ Username: username_or_email }, { Email: username_or_email }] });

    if (!user) errors.username_or_email = "User not found"
    else {
      const match = await bcrypt.compare(passwordvalue, user.Password)
      if (!match) errors.passwordvalue = "Incorrect Password"
    }

    if (Object.keys(errors).length > 0) {
      res.render('login', { 
        debug: { errors: errors},
        fields: {
          username_or_email: req.body.username_or_email
        }
      })
    } else {
      req.session.userId = user._id;
      res.redirect('/');
    }
  } catch (err) {
    res.render('login', { debug: { error: 'Error accessing users'} });
  }
}).post('/auth/register', async (req, res) => {
  const { email, name, username, password_field, confirm_password } = req.body;
  let errors = {};

  if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters long.';
  }

  if (name.length < 3) {
    errors.name = 'Name must be at least 3 characters long.';
  }

  if (password_field !== confirm_password) {
    errors.password = 'Passwords do not match.';
  }

  if (Object.keys(errors).length > 0) {
    res.render('register', { 
      debug: { errors: errors },
      fields: {
        email: req.body.email,
        name: req.body.name,
        username: req.body.username,
      }
    })
  }

  try {
    const client = await MongoClient.connect(dbUrl, { useUnifiedTopology: true });
    const db = client.db(dbName);
    const users = db.collection("Users");

    const existingUser = await users.findOne({ $or: [{ Email: email }, { Username: username }] });

    if (existingUser) {
      errors.email = 'Email or username already exists. Please choose another.'
      errors.username = 'Email or username already exists. Please choose another.'
      
      res.render('register', { 
        debug: { errors: errors },
        fields: {
          email: req.body.email,
          name: req.body.name,
          username: req.body.username,
        }
      })
    }

    const hashedPassword = await bcrypt.hash(password_field, 10);

    await users.insertOne({
      Email: email,
      Name: name,
      Username: username,
      Password: hashedPassword,
      Image: '/public/img/icons/DefaultProfileIcon.png'
    });
    req.session.success = "User registered successfully";
    res.redirect('/auth/login?success=User registered successfully');
  } catch (err) {
    res.render('register', { debug: { error: 'Error accessing the database'} });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) {
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
