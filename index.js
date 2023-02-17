require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const fs = require("fs");
var bodyParser = require("body-parser");
const { url } = require("inspector");
const dns = require("dns");
const { URL } = require("url");

// DB
let urlDatas;
const urlDataFile = `${__dirname}/public/data.json`;
const loadURLs = () => {
  if (fs.existsSync(urlDataFile)) {
    urlDatas = JSON.parse(fs.readFileSync(urlDataFile, "utf8"));
  } else {
    urlDatas = {};
  }
};

const saveURL = (url) => {
  urlDatas.seqNo = urlDatas.seqNo ? urlDatas.seqNo + 1 : 1;
  const short_url = String(urlDatas.seqNo);

  let s2u = {};
  s2u[short_url] = url;
  let u2s = {};
  u2s[url] = short_url;

  console.log("saveURL:");
  console.log(urlDatas.shortToURL);
  console.log(urlDatas.URLToShort);
  console.log("end saveURL:");

  urlDatas.shortToURL = Object.assign({}, urlDatas.shortToURL, s2u);
  urlDatas.URLToShort = Object.assign({}, urlDatas.URLToShort, u2s);
  console.log(urlDatas);
  fs.writeFileSync(urlDataFile, JSON.stringify(urlDatas));
  return short_url;
};

// find url by short_url or url
const findURL = ({ url, short_url }) => {
  if (url) {
    return urlDatas.URLToShort ? urlDatas.URLToShort[url] : null;
  }
  return urlDatas.shortToURL ? urlDatas.shortToURL[short_url] : null;
};

loadURLs();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", function (req, res) {
  const inputURL = req.body.url;
  console.log(`/api/shorturl: ${inputURL}`);
  if (!inputURL) {
    res.json({ error: "invalid url" });
    return;
  }
  let short_url = findURL({ url: inputURL });
  if (short_url) {
    res.json({ original_url: inputURL, short_url: short_url });
    return;
  }

  try {
    const url = new URL(inputURL);
    console.log(`url host: ${url.host}`);
    dns.lookup(url.host, { all: true }, (err, address) => {
      if (err) {
        console.log(`url host error: ${err}`);
        res.json({ error: "invalid url" });
        return;
      }
      short_url = saveURL(inputURL);
      res.json({ original_url: inputURL, short_url: short_url });
    });
  } catch (err) {
    res.json({ error: "invalid url" });
  }
});

app.get("/api/shorturl/:short_url", function (req, res) {
  console.log(`/api/shorturl/:short_url: req.params.short_url`);
  const url = findURL({ short_url: req.params.short_url });
  if (url) {
    res.redirect(url);
    return;
  }
  res.json({ error: "invalid url" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
