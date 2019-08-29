// NOTE - code copied from NUEVA repo (week 18 activity 20) as template

var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// use Schema constructor to create a new object
var CommentSchema = new Schema({
    // `title` is of type String
    title: String,
    // `body` is of type String
    body: String
});

// This creates our model from the above schema, using mongoose's model method
var Comment = mongoose.model("Comment", CommentSchema);

// Export the Comment model
module.exports = Comment;
