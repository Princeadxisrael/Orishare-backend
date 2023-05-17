const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const HttpError = require("./models/http-error");

const placesRoutes = require("./routes/places-route");

const usersRoutes = require("./routes/users-route");

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Acesss-Control-Allow-Methods", "POST, GET, PATCH, DElETE");
  next();
});

//adding a route middleware
app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

//setting a middleware that runs when there is a request that dont get a response
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  return next(error);
});

//adding an error middle ware function
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
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
