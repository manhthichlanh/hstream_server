const express = require('express');
const axios = require('axios');
const cors = require("cors");
const router = express.Router();;

const app = express();
app.use(express.json());
app.use(cors());

// Middleware ghi log request
let currentProxyIndex = 0; // Dùng để cân bằng tải theo Round Robin
const proxyList = [
    "https://chibi-str.imoto-h.xyz",
    "https://koneko-str.musume-h.xyz",
    "https://imoto-str.ane-h.xyz",
    "https://shinobu-str.rorikon-h.xyz"
]
const middleBalance = (req, res, next) => {
    try {
        // Chọn proxy theo Round Robin
        const proxy = proxyList[currentProxyIndex];
        currentProxyIndex = (currentProxyIndex + 1) % proxyList.length; // Chuyển sang proxy tiếp theo
        // Tạo URL đích từ request gốc
        const targetServer = `${proxy}`;
        req.targetServer = targetServer;
        console.log({targetServer})
        return next();
    } catch(err) {
        console.log("server blance err", err);
        return res.status(500).send({message:"Server Balance Error"});
    }
};

// Sử dụng middleware cho tất cả request
app.use(middleBalance);

const getDataBuffer = async (url) => {
    return await axios({
        url: url,
        method: "GET",
        responseType: "arraybuffer",
        headers: {
            "accept": "*/*",
            "accept-language": "vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\", \"Google Chrome\";v=\"132\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "Referer": "https://hstream.moe/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        }
    });
}
const handleRequest = async (req, res) => {
  try {
    const requestUrl = `${req.targetServer}${req.urlPath}`;
    const response = await getDataBuffer(requestUrl);
    res.set("Content-Type", response.headers["content-type"]);
    return res.status(200).send(response.data); 
  } catch (error) {
    console.error("Server Error:", error.message);
    return res.status(500).json({ error: "Không thể lấy tài nguyên từ server gốc" });
  }
}

app.get("/:year/:series/:episode/thumbs.vtt", async (req, res, next) => {
    const urlPath = `/${req.params.year}/${req.params.series}/${req.params.episode}/thumbs.vtt`;
    req.urlPath = urlPath;
    return next();
}, handleRequest);

app.get("/:year/:series/:episode/sprite.jpg", async (req, res, next) => {
    const urlPath = `/${req.params.year}/${req.params.series}/${req.params.episode}/sprite.jpg`;
    req.urlPath = urlPath;
    return next();
}, handleRequest);

app.get("/:year/:series/:episode/eng.ass", async (req, res, next) => {
    const urlPath = `/${req.params.year}/${req.params.series}/${req.params.episode}/eng.ass`;
    req.urlPath = urlPath;
    return next();
}, handleRequest);

app.get("/:year/:series/:episode/:quality/manifest.mpd", async (req, res, next) => {
    const urlPath = `/${req.params.year}/${req.params.series}/${req.params.episode}/${req.params.quality}/manifest.mpd`;
    req.urlPath = urlPath;
    return next();
}, handleRequest);

app.get("/:year/:series/:episode/:quality/chunks/:chunk", async (req, res, next) => {
    const urlPath = `/${req.params.year}/${req.params.series}/${req.params.episode}/${req.params.quality}/chunks/${req.params.chunk}`;
    req.urlPath = urlPath;
    return next();
}, handleRequest);

router.get("/", (req, res) => {
    res.send("App is running..");
});

app.use("/.netlify/functions/app", router);
module.exports.handler = serverless(app);
