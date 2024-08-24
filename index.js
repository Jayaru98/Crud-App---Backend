const express = require("express");
const mongoose = require("mongoose");
const Product = require("./models/product.model.js");
const productRoute = require("./routes/product.route.js");
const app = express();

//middleware
app.use(express.json());

//routes
app.use("/api/products", productRoute);


mongoose
  .connect(
    "mongodb+srv://delenta:delenta@nodeapi.pvtnh.mongodb.net/?retryWrites=true&w=majority&appName=nodeAPI"
  )
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
