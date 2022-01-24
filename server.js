require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongo = require("mongodb");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const shortid = require("shortid");

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

const uri = process.env.MONGO_URI;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
});

const connection = mongoose.connection;
connection.on("error", console.error.bind(console, "Connection error: "));
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String,
});
const URL = mongoose.model("URL", urlSchema);

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());
app.use(express.json());
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async function (req, res) {
  // console.log(req.body);

  let urlLong = req.body.url,
    urlShort = shortid.generate(),
    urlRegex =
      /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/g.test(
        urlLong
      );
  if (!urlRegex) {
    return res.json({
      error: "Invalid URL",
    });
  } else {
    try {
      // Aquí checkeamos si la Url ya existe en la DB
      let findOne = await URL.findOne({
        original_url: urlLong,
      });
      if (findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url,
        });
      } else {
        // Si todavía no existe, entonces creamos uno nuevo y respondemos con el resultado
        findOne = new URL({
          original_url: urlLong,
          short_url: urlShort,
        });
        await findOne.save();
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url,
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json("Server error...");
    }
  }
});
app.get("/api/shorturl/:short_url?", async function (req, res) {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url,
    });
    if (urlParams) {
      return res.redirect(urlParams.original_url);
    } else {
      return res.status(404).json("No URL found");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Server error");
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
