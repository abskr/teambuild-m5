import express from "express";
import cors from "cors";
import productsRoute from "./products/index.js";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
// import reviewsRoute from "./reviews/index.js"

const server = express();
const port = process.env.PORT || 5000;
const pathToPublic = join(
  dirname(fileURLToPath(import.meta.url), "../public/img")
);

server.use(express.static(pathToPublic));
server.use(cors());
server.use(express.json());

server.use("/products", productsRoute);
// server.use("/products/reviews", reviewsRoute)

server.listen(port, () => console.log("Server is running on port: ", port));
server.on("error", (error) => console.log("Server is not running ", error));
