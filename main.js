const express = require("express")
const bodyParser = require("body-parser")
const path = require("path")
const { MongoClient, ObjectId } = require("mongodb")
const session = require('express-session')
const bcrypt = require('bcrypt')
const fileUpload = require('express-fileupload')
const { Console } = require("console")

const app = express()

const dbUrl = 'mongodb://localhost:27017'
const dbName = "BrainBurst"

app.engine("html", require("ejs").renderFile)
app.set("view engine", "html")
app.use("/public", express.static(path.join(__dirname, "public")))
app.set("views", path.join(__dirname, "/views"))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(fileUpload())

app.use(session({
  secret: 'SECRETKEY',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}))

app.get("/:page?", async (req, res) => {
  const page = req.params.page || "Home"
  let user

  if (req.session.userId) {
    try {
      const client = await MongoClient.connect(dbUrl)
      const db = client.db(dbName)
      const users = db.collection("Users")

      const userId = new ObjectId(req.session.userId)

      user = await users.findOne({ _id: userId })
      if (user) user.password = undefined

    } catch (err) {
      console.log(err)
    }
  }

  res.render(`main/${page}.html`, { currentPage: page, user: user }, (err, html) => {
      if (err)res.render("main/404.html", { currentPage: page, user: user })
      else res.send(html)
  })
})

app.get("/programming/:page?", async (req, res) => {
  const page = req.params.page || "Home"
  let user

  if (req.session.userId) {
    try {
      const client = await MongoClient.connect(dbUrl)
      const db = client.db(dbName)
      const users = db.collection("Users")

      const userId = new ObjectId(req.session.userId)

      user = await users.findOne({ _id: userId })
      if (user) user.password = undefined

    } catch (err) {
      console.log(err)
    }
  }

  res.render(`programming/${page}.html`, { currentPage: page, user: user }, (err, html) => {
      if (err)res.render("main/404.html", { currentPage: page, user: user  })
      else res.send(html)
  })
})

app.get('/auth/logout', (req, res) => {
  req.session.destroy(err => { res.redirect('/') })
});

app.get("/auth/:page?", (req, res) => {
  const page = req.params.page
  const successMessage = req.query.success || ''
  console.log(page)
  res.render(`auth/${page}.html`, { debug: { success: successMessage }, fields: {} }, (err, html) => {
      if (err) res.redirect("/404")
      else res.send(html)
  })
})

app.post('/auth/login', async (req, res) => {
  const { username_or_email, passwordvalue } = req.body
  let errors = {}

  try {
    const client = await MongoClient.connect(dbUrl)
    const db = client.db(dbName)
    const users = db.collection("Users")

    const user = await users.findOne({ $or: [{ Username: username_or_email }, { Email: username_or_email }] })

    if (!user) errors.username_or_email = "User not found"
    else {
      const match = await bcrypt.compare(passwordvalue, user.Password)
      if (!match) errors.passwordvalue = "Incorrect Password"
    }

    if (Object.keys(errors).length > 0) {
      res.render('auth/login', { 
        debug: { errors: errors},
        fields: {
          username_or_email: req.body.username_or_email
        }
      })
    } else {
      req.session.userId = user._id
      res.redirect('/')
    }
  } catch (err) {
    res.render('auth/login', { debug: { error: 'Error accessing users'} })
  }
}).post('/auth/register', async (req, res) => {
  const { email, name, username, password_field, confirm_password } = req.body
  let errors = {}

  if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters long.'
  }

  if (name.length < 3) {
    errors.name = 'Name must be at least 3 characters long.'
  }

  if (password_field != confirm_password) {
    errors.password = 'Passwords do not match.'
  } else {
    if (password_field.length < 8) {
      errors.password = "Password must be at least 8 characters long.";
    } else if (!/[a-z]/.test(password_field)) {
      errors.password = "Password must contain at least one lowercase letter.";
    } else if (!/[A-Z]/.test(password_field)) {
      errors.password = "Password must contain at least one uppercase letter.";
    } else if (!/\d/.test(password_field)) {
      errors.password = "Password must contain at least one digit.";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password_field)) {
      errors.password = "Password must contain at least one special character.";
    }
  }  

  if (Object.keys(errors).length > 0) {
    console.log(errors, password_field, !password_field.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/))
    res.render('auth/register', { 
      debug: { errors: errors },
      fields: {
        email: req.body.email,
        name: req.body.name,
        username: req.body.username,
      }
    })
    return;
  }

  try {
    const client = await MongoClient.connect(dbUrl)
    const db = client.db(dbName)
    const users = db.collection("Users")

    const existingUser = await users.findOne({ $or: [{ Email: email }, { Username: username }] })

    if (existingUser) {
      errors.email = 'Email or username already exists. Please choose another.'
      errors.username = 'Email or username already exists. Please choose another.'
      
      res.render('auth/register', { 
        debug: { errors: errors },
        fields: {
          email: req.body.email,
          name: req.body.name,
          username: req.body.username,
        }
      })
      return;
    } else {
      const hashedPassword = await bcrypt.hash(password_field, 10)

      await users.insertOne({
        Email: email,
        Name: name,
        Username: username,
        Password: hashedPassword,
        Image: '/public/img/icons/DefaultProfileIcon.png'
      })
  
      res.redirect('/auth/login?success=User+registered+successfully');
    }
  } catch (err) {
    res.render('auth/register', { debug: { error: 'Error accessing the database'} })
  }
})

const PORT = 7001
app.listen(PORT, () => {
    console.log(`Brain Burst running on Page http://localhost:${PORT}`)
})
