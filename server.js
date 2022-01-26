require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const bodyParser = require("body-parser");
const dns = require("dns");
const url = require("url");

const app = express();

const mySecret = process.env["MONGO_URI"];
mongoose.connect(mySecret, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
});

const ShortURL = require("./models/ShortURL");

console.log(mongoose.connection.readyState);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl/", function (req, res) {
  const lookUpUrl = req.body.url;
  const parsedUrl = url.parse(lookUpUrl);

  dns.lookup(parsedUrl.hostname, (error, address, family) => {
    if (!error && parsedUrl.hostname != null) {
      let newUrl = new ShortURL({
        original_url: parsedUrl.href,
        short_url: new Date().getTime().toString(36),
      });

      newUrl.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          res.json({
            original_url: newUrl.original_url,
            short_url: newUrl.short_url,
          });
        }
      });
    } else {
      res.json({ error: "invalid url" });
      console.log(error, address, family);
    }
  });
});

app.get("/api/shorturl/:url?", function (req, res) {
  let parameter = req.params.url;
  console.log(parameter);

  ShortURL.findOne({ short_url: parameter }, function (err, data) {
    if (err) return next(err);

    console.log(`Redirecting to:${data.original_url}...`);
    res.redirect(data.original_url);
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
