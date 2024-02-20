const express = require("express")
const bodyParser = require("body-parser")
const path = require("path")
const mongodb = require("mongodb")
const session = require('express-session');

const app = express()

const uri = 'mongodb://localhost:27017'
const DB = "BrainBurst"

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
  const page = req.params.page || "index";
  
  res.render(`${page}.html`, {}, (err, html) => {
      if (err) {
          res.render("404.html");
      } else {
          res.send(html);
      }
  });
});



const PORT = 7001
app.listen(PORT, () => {
    console.log(`Brain Burst running on Page http://localhost:${PORT}`)
})
