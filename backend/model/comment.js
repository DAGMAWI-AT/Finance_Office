// model/comment.js
const { client } = require("../configuration/db");  // Import the MongoDB client from app.js

const commentCollection = client
      .db("finance_office")
      .collection("comment");
      
module.exports = {
    commentCollection,
};
