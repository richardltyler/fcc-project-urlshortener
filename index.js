require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const dns = require("dns");
const bodyParser = require("body-parser");
const urlParser = require("url");
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.DB_URL);
const db = client.db("urlshortener");
const urls = db.collection("urlshortener");

// Basic Configuration
const port = process.env.PORT || 3000;

// middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", (req, res) => {
  const { url } = req.body;

  const dnsLookup = dns.lookup(
    new URL(url).hostname,
    async (error, address, family) => {
      if (error || !address) {
        res.json({ error: "invalid url" });
      } else {
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url,
          short_url: urlCount,
        };

        const result = await urls.insertOne(urlDoc);

        res.json({ original_url: url, short_url: urlCount });
      }
    }
  );
});

app.get("/api/shorturl/:shorturl", async (req, res) => {
  const { shorturl } = req.params;

  const urlDoc = await urls.findOne({ short_url: +shorturl });
  res.redirect(urlDoc.url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
