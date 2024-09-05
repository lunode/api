const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
async function main() {
  const { JSONFilePreset } = await import("lowdb/node");
  return { JSONFilePreset };
}
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
main().then(async ({ JSONFilePreset }) => {
  const app = express();
  const router = express.Router();
  const db = await JSONFilePreset("db.json", []);
  // 列表
  router.get("/:model", validateModel, validateQuery, (req, res) => {
    const { page, limit } = req.query;
    const start = (page - 1) * limit;
    const end = limit * page;
    console.log(start, end);
    const data = db.data[req.params.model]
      .toSorted((a, b) => b.id - a.id)
      .slice(start, end);
    res.send(data);
  });
  // 详情
  router.get("/:model/:id", validateModel, (req, res) => {
    console.log(req.params.model);
    console.log();
    const data = db.data[req.params.model].find(
      (item) => item.id == req.params.id
    );
    if (!data) {
      return res.status(404).send("Not Found");
    }
    res.send(data);
  });
  // 删除
  router.delete("/:model/:id", validateModel, (req, res) => {
    const index = db.data[req.params.model].findIndex(
      (item) => item.id == req.params.id
    );
    if (index < 0) {
      return res.status(404).send("数据不存在");
    }
    db.data[req.params.model].splice(index, 1);
    db.write();
    res.send({ message: "删除成功" });
  });
  // 新增数据（Create）
  router.post("/:model", validateModel, (req, res) => {
    const newItem = req.body;
    const maxIdItem = db.data[req.params.model]
      .sort((a, b) => b.id - a.id)
      .shift();
    newItem.id = maxIdItem ? maxIdItem.id + 1 : 1;
    db.data[req.params.model].push(newItem);
    db.write();
    res.status(201).send(newItem);
  });
  // 更新部分数据
  router.patch("/:model/:id", validateModel, (req, res) => {
    const index = db.data[req.params.model].findIndex(
      (item) => item.id == req.params.id
    );
    if (index < 0) {
      return res.status(404).send({ message: "数据不存在" });
    }
    db.data[req.params.model].splice(index, 1, {
      ...db.data[req.params.model][index],
      ...req.body,
    });
    db.write();
    res.send(db.data[req.params.model][index]);
  });
  // 更新全部数据
  router.put("/:model/:id", validateModel, (req, res) => {
    const index = db.data[req.params.model].findIndex(
      (item) => item.id == req.params.id
    );
    if (index < 0) {
      return res.status(404).send({ message: "数据不存在" });
    }
    db.data[req.params.model].splice(index, 1, {
      ...req.body,
      id: db.data[req.params.model][index].id,
    });
    res.send(data);
  });
  // /posts/1/comments
  // /albums/1/photos
  router.get("/posts/:id/comments", (req, res) => {
    const { id } = req.params;
    const item = db.data["posts"].find((item) => item.id == id);
    if (!item) {
      return res.status(404).send(`Not Found`);
    }
    const data = db.data["comments"].filter((item) => item.postId == id);
    res.send(data);
  });
  router.get("/albums/:id/photos", (req, res) => {
    const { id } = req.params;
    const item = db.data["albums"].find((item) => item.id == id);
    if (!item) {
      return res.status(404).send(`Not Found`);
    }
    const data = db.data["photos"].filter((item) => item.albumId == id);
    res.send(data);
  });
  // /users/1/albums
  // /users/1/todos
  // /users/1/posts
  router.get("/users/:id/:model", (req, res) => {
    const { id, model } = req.params;
    if (!["ablums", "todos", "posts"].includes(model)) {
      return res.status(405).send("Not Implemented");
    }
    const item = db.data["users"].find((item) => item.id == id);
    if (!item) {
      return res.status(404).send(`Not Found`);
    }
    const data = db.data[model].filter((item) => item.userId == id);
    res.send(data);
  });
  router.get("/", (req, res) => {
    const indexStream = fs.createReadStream("./public/index.html");
    indexStream.pipe(res);
    indexStream.on("end", () => {
      res.end();
    });
  });
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(router);
  app.listen(3000, () => {
    console.log("app listen 3000");
  });
});
