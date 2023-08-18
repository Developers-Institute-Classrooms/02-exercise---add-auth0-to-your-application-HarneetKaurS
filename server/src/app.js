const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const { celebrate, Joi, errors, Segments } = require("celebrate");
const { auth } = require('express-oauth2-jwt-bearer');

const PropertyModel = require("./models/PropertyModel");
const formatProperty = require("./formatProperty");

const app = express();

const checkJwt = auth({
  audience: 'https://housetricks.com',
  issuerBaseURL: `https://dev-67v1j53bpc2usven.au.auth0.com/`,
});

app.use(cors());

app.use(express.json());

app.post(
  "/properties",
  checkJwt,
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      description: Joi.string().required(),
      address: Joi.string().required(),
      title: Joi.string().required(),
      img: Joi.string().required(),
      askingPrice: Joi.number().min(0).required(),
    }),
  }),
  async (req, res, next) => {
    try {
      const { body, auth } = req;
      const propertybody = {
        createdBy: auth.payload.sub,
        ...body,
     
      }
      const property = new PropertyModel(propertybody);
      await property.save();
      return res.status(201).send(formatProperty(property));
    } catch (error) {
      error.status = 400;
      next(error);
    }
  }
);

app.get("/properties", async (req, res) => {
  const properties = await PropertyModel.find({});
  return res.status(200).send(properties.map(formatProperty));
});

app.get("/properties/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: "bad id" });
  }

  const property = await PropertyModel.findById(id);

  if (property === null) {
    return res.status(404).send("not found");
  }

  return res.status(200).send(formatProperty(property));
});

app.use(errors());

module.exports = app;
