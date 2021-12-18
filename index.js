const express = require("express");
const app = express();
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const port = process.env.PROT || 5000;
const { MongoClient } = require("mongodb");

// MIDDLEWARE
app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.14uaf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const databse = client.db("Store-hunt");
    const productCollection = databse.collection("product");
    const ordersCollection = databse.collection("order");

    //   app.get for all products
    app.get("/product", async (req, res) => {
      const size = parseInt(req.query.size);
      const cursor = productCollection.find({});
      let result;
      if (size) {
        result = await cursor.limit(size).toArray();
      } else {
        result = await cursor.toArray();
      }
      res.json(result);
    });
    // app.post via gmail
    app.post("/order", async (req, res) => {
      const order = req.body;
      const cursor = await ordersCollection.insertOne(order);
      res.json(cursor);
    });

    //   MANAGE ALL ORDERS
    app.get("/manageOrders", async (req, res) => {
      const cursor = ordersCollection.find({});
      const result = await cursor.toArray();
      res.json(result);
    });
    //   app.get by gmail
    app.get("/order", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = ordersCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    });

    // DELETE API
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.json(result);
    });
    // DELETE API
    app.delete("/manageOrders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.json(result);
    });
    // ADD PRODUCT VY AXIOS
    app.post("/product", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.json(result);
      console.log(result);
    });
    //   app.get for single product
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cursor = await productCollection.findOne(query);
      res.json(cursor);
    });
    // DELETE API FOR MANAGE ORDER
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello from store market");
});
app.listen(port, () => {
  console.log("listening from ", port);
});
