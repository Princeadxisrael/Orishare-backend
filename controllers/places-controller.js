// const uuid = require("uuid").v4; //using const uuid= require("uuid/v4") results in a nodemon crash
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Place = require("../models/place");
const User = require("../models/user");
const user = require("../models/user");

//create a post req: place by id request middleware function
const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(errors);
    return next(new HttpError("invalid inputs, check your data", 422));
  }
  const { title, description, coordinates, address, creator } = req.body;

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image:
      "https://offloadmedia.feverup.com/secretnyc.co/wp-content/uploads/2020/09/20071618/esb-1.jpg",
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError("Creating place failed, please try again", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Could not find the user id, please try again",
      404
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess }); //.save is a method in mongoose used to handle all the MGDB code needed to store docs in your collections, it will also create automatically unique ids
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("creating place failed, try again", 500);
    return next(error);
  }

  //send status code 201 for a NEW successful creation on server
  res.status(201).json({ place: createdPlace });
};

//create a get req: place by id request middleware function
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; //extracting the id first
  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Could not find place", 500);
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      "could not find place for the provided id",
      404
    );
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
};

//create a get req: place by userid request middleware function
const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid; //extracting the id
  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      "Fetching place by User id failed, try again",
      500
    );
    return next(error);
  }

  if (!places || places.length === 0) {
    const error = new HttpError(
      "could not find places for the provided user id",
      404
    );
    return next(error);
  }

  res.json({
    places: places.map((place) => {
      place.toObject({ getters: true });
    }),
  }); //this is equivalent to {place:place}
};

//create a patch req: place by id request middleware function
const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(errors);
    return next(new HttpError("invalid inputs, check your data", 422));
  }
  const { title, description } = req.body;
  const placeId = req.params.pid; //extract the id
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "something is wrong, could not update place",
      500
    );
    return next(error);
  }
  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError("something went wrong,could not update place");
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

//create a delete req: place by id request middleware function
const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "something is wrong, could not delete place",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("could not find place id", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "something is wrong, could not delete place",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "deleted place" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
