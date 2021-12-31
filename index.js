const express = require("express");
const app = express();
const cors = require("cors");
const admin = require("firebase-admin");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient } = require("mongodb");

// MIDDLEWARE

const serviceAccount = require("./store-hunt-firebase-adminsdk.json");
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.14uaf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log(uri);

async function verifyToken(req, res, nex) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }

  nex();
}

async function run() {
  try {
    await client.connect();
    const databse = client.db("Store-hunt");
    const productCollection = databse.collection("product");
    const ordersCollection = databse.collection("order");
    const usersCollection = databse.collection("users");

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
    // UPDATE STATUS
    app.put("/manageOrders", async (req, res) => {
      const id = req.body._id;
      const checked = req.body.checked;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const data = { $set: { pending: checked } };
      const result = await ordersCollection.updateOne(query, data, options);
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

    // save data to the database
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
      console.log(result);
    });

    // GET ADMIN BY ROLE
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const user = await usersCollection.findOne(filter);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // Update User data to the database
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
      console.log(result);
    });

    // SET ADMIN ROLE
    app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;
      const requester = req.decodedEmail;
      if (requester) {
        const requesterIdenty = await usersCollection.findOne({
          email: requester,
        });
        if (requesterIdenty.role === "admin") {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: "admin" } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res
          .status(403)
          .json({ message: "you do not have any permission to access" });
      }
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
