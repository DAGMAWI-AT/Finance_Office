//model/cso
const { client } = require("../configuration/db");  // Import the MongoDB client from app.js

const CSOCollection = client.db("finance_office").collection("cso");

module.exports = {
    CSOCollection,
};
