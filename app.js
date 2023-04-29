const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const HttpError = require("./models/http-error");

const placesRoutes = require("./routes/places-route");

const usersRoutes = require("./routes/users-route");

const app = express();

app.use(bodyParser.json()); //using the bodyparser middleware to obtain any incoming req body and convert the data to a JS data structure

//adding a route middleware
app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

//setting a middleware that runs when there is a request that dont get a response
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

//adding an error middle ware function
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500); //a 500 code indicates something went wrong on the server
  res.json({ message: error.message || "An unknown error occurred" });
});

mongoose
  .connect(
    "mongodb+srv://Princeuz:orishare@cluster0.n3e5g3z.mongodb.net/places?retryWrites=true&w=majority"
  )
  .then(() => {
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
