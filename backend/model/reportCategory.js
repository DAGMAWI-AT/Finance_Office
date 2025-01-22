const { client } = require("../configuration/db");  // Import the MongoDB client from db.js

const reportCategoryCollection = client.db("finance_office").collection("report_category");

module.exports = {
    reportCategoryCollection,
};
