const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const cors = require("cors");
const simpleSvgPlaceholder = require("./svg.js");

const db = require("./db.json");
const app = express();
const router = express.Router();
const validateModel = (req, res, next) => {
  console.log(req.params.model);
  if (
    !["users", "posts", "todos", "albums", "photos", "comments"].includes(
      req.params.model
    )
  ) {
    return res.status(405).send("Not Found");
  }
  next();
};
const validateQuery = (req, res, next) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  console.log(page, limit);
  if (Number.isNaN(page) || Number.isNaN(limit) || page < 1 || limit < 1) {
    return res.status(400).send("Bad Query");
  }
  req.query.page = page;
  req.query.limit = limit;
  next();
};
// 列表
router.get("/:model", validateModel, validateQuery, (req, res) => {
  const { page, limit } = req.query;
  const start = (page - 1) * limit;
  const end = limit * page;
  console.log(start, end);
  const data = db[req.params.model]
    .sort((a, b) => b.id - a.id)
    .slice(start, end);
  res.send(data);
});
// 详情
router.get("/:model/:id", validateModel, (req, res) => {
  console.log(req.params.model);
  console.log();
  const data = db[req.params.model].find((item) => item.id == req.params.id);
  if (!data) {
    return res.status(404).send("Not Found");
  }
  res.send(data);
});
// 删除
router.delete("/:model/:id", validateModel, (req, res) => {
  const index = db[req.params.model].findIndex(
    (item) => item.id == req.params.id
  );
  if (index < 0) {
    return res.status(404).send("数据不存在");
  }
  db[req.params.model].splice(index, 1);
  res.send({ message: "删除成功" });
});
// 新增数据（Create）
router.post("/:model", validateModel, (req, res) => {
  const newItem = req.body;
  const maxId = db[req.params.model].reduce((a, b) => (b.id > a ? b.id : a), 0);
  newItem.id = maxId + 1;
  db[req.params.model].push(newItem);
  res.status(201).send(newItem);
});
// 更新部分数据
router.patch("/:model/:id", validateModel, (req, res) => {
  const index = db[req.params.model].findIndex(
    (item) => item.id == req.params.id
  );
  if (index < 0) {
    return res.status(404).send({ message: "数据不存在" });
  }
  db[req.params.model].splice(index, 1, {
    ...db[req.params.model][index],
    ...req.body,
  });
  res.send(db[req.params.model][index]);
});
// 更新全部数据
router.put("/:model/:id", validateModel, (req, res) => {
  const index = db[req.params.model].findIndex(
    (item) => item.id == req.params.id
  );
  if (index < 0) {
    return res.status(404).send({ message: "数据不存在" });
  }
  const data = {
    ...req.body,
    id: db[req.params.model][index].id,
  };

  db[req.params.model].splice(index, 1, data);
  res.send(data);
});
// /posts/1/comments
// /albums/1/photos
router.get("/posts/:id/comments", (req, res) => {
  const { id } = req.params;
  const item = db["posts"].find((item) => item.id == id);
  if (!item) {
    return res.status(404).send(`Not Found`);
  }
  const data = db["comments"].filter((item) => item.postId == id);
  res.send(data);
});
router.get("/albums/:id/photos", (req, res) => {
  const { id } = req.params;
  const item = db["albums"].find((item) => item.id == id);
  if (!item) {
    return res.status(404).send(`Not Found`);
  }
  const data = db["photos"].filter((item) => item.albumId == id);
  res.send(data);
});
// /users/1/albums
// /users/1/todos
// /users/1/posts
router.get("/users/:id/:model", (req, res) => {
  const { id, model } = req.params;
  if (!["albums", "todos", "posts"].includes(model)) {
    return res.status(405).send("Not Implemented");
  }
  const item = db["users"].find((item) => item.id == id);
  if (!item) {
    return res.status(404).send(`Not Found`);
  }
  const data = db[model].filter((item) => item.userId == id);
  res.send(data);
});
router.get("/", (req, res) => {
  const indexStream = fs.createReadStream("./public/index.html");
  indexStream.pipe(res);
  indexStream.on("end", () => {
    res.end();
  });
});
router.get("/public/img/:width/:color", (req, res) => {
  const width = parseInt(req.params.width);
  const color = req.params.color;
  const height = width;
  console.log(width, color);
  const img = simpleSvgPlaceholder({
    width: width,
    height: height,
    text: `${width} x ${height}`,
    bgColor: `#${color}` || "#92c952",
    textColor: "#9C9C9C",
  });
  res.set("Cache-Control", "public, max-age=86400"); // 缓存 24 小时
  res.set("Content-Type", "image/svg+xml");
  res.send(img);
});
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(router);
app.listen(3000, () => {
  console.log("app listen 3000");
});
const saveData = () => {
  fs.writeFileSync(`db.json`, JSON.stringify(db));
};
process.on("beforeExit", (msg) => {
  console.log("beforeExit", msg);
  saveData();
});
process.on("SIGTERM", (msg) => {
  console.log("SIGTERM", msg);
  saveData();
  process.exit(0); // 确保保存数据后正确退出
});
process.on("uncaughtException", (msg) => {
  console.log("uncaughtException", msg);
});
process.on("unhandledRejection", (msg) => {
  console.log("unhandledRejection", msg);
});
