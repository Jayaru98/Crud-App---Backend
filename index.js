const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const productRoute = require("./routes/product.route.js");
const app = express();

//middleware
app.use(express.json());

//routes
app.use("/api/products", productRoute);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to database!");
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch(() => {
    console.log("Connection failed!");
  });
0;

module.exports = app;
