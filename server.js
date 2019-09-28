// Require all necessary npm pachages
var express = require("express");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

// Require all js files in models
var db = require("./models")

// Initialize express
var app = express();

// Point port to process.env.PORT:
var PORT = process.env.PORT || 3000;

// Middleware - parse request body and make public a static folder/route path
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Connect to Mongo DB from heroku and store in variable
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scrapeTest";
mongoose.connect(MONGODB_URI);

// make handlebars file the root route - GARBAGE, emma delete or fix
app.get("/", function (req, res) {
  db.Article.find({})
    .then(function (dbArticle) {
      res.render("index", { articles: dbArticle });
    })
})

// Routes - copied from NUEVA repo (week 18 activity 20) as placeholder
// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with axios - this is for the culture section only
  axios.get("https://www.gentlebarn.org/blog/").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("div.post").each(function (i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        // .children("div.post")
        .children("h2.title")
        .text();
      result.link = $(this)
        .children("div.post")
        .children("h2.title")
        .children("a")
        .attr("href")
      result.description = $(this)
        .children("div.entry")
        .children("div.row")
        .children("div.large-12 columns")
        .children("p")
        .text()
      // result.image=$(this)
      //   .children("div.views-field-field-featured-image-external")
      //   .children("a")
      //   .children("a")
      //   .children("img")
      //   .attr("src")

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function (dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function (err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    // res.send("Scrape Complete");
    res.render("scrape", { status: "Scrape Complete" })
  });
});

app.put("/save/:id", function(req,res){
  db.Article.findOne({_id: req.params.id})
  .update({saved: true})
  .catch(function(err){
    res.json(err);
  })
})

// Route for getting all Articles from the db
app.get("/articles/saved", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({saved: true})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.render("saved",{ savedArticle:  dbArticle});
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Create listener to start server
app.listen(PORT, function () {
  console.log("app running on port", PORT)
});