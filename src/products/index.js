import { Router } from "express";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import fs from "fs-extra";
import uniqid from "uniqid";
import multer from "multer";

const route = Router();

const pathToProducts = join(
  dirname(fileURLToPath(import.meta.url)),
  "../data/products.json"
);
console.log({ pathToProducts });

const pathToPublicImages = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../public/img"
);

route.get("/", async (req, res, next) => {
  try {
    const products = await fs.readJSON(pathToProducts);
    res.status(200).send(products);
  } catch (err) {
    const error = new Error(err.message);
    error.httpStatusCode = 500;
    next(error);
  }
});

route.get("/:id", async (req, res, next) => {
  try {
    const productsInDB = await fs.readJSON(pathToProducts);
    const product = productsInDB.find(
      (product) => product.id === req.params.id
    );
    if (product) {
      res.status(200).send(product);
    } else {
      const error = new Error({ message: `No product matching this id found` });
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (err) {
    const error = new Error(err.message);
    error.httpStatusCode = 500;
    next(error);
  }
});

route.post("/", async (req, res, next) => {
  try {
    let productsInDB = await fs.readJSON(pathToProducts);
    const newProductObj = {
      ...req.body,
      id: uniqid(),
      reviews: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    productsInDB.push(newProductObj);
    await fs.writeJSON(pathToProducts, productsInDB);
    res.status(201).send(newProductObj);
  } catch (err) {
    const error = new Error(err.message);
    error.httpStatusCode = 500;
    next(error);
  }
});

route.put("/:id", async (req, res, next) => {
  try {
    let productsInDB = await fs.readJSON(pathToProducts);
    const product = productsInDB.find(
      (product) => product.id === req.params.id
    );
    if (product) {
      const productObj = {
        ...product,
        ...req.body,
        updatedAt: new Date(),
      };
      productsInDB = productsInDB.filter(
        (product) => product.id !== req.params.id
      );
      productsInDB.push(productObj);
      await fs.writeJSON(pathToProducts, productsInDB);
      res.status(201).send(productObj);
    } else {
      const error = new Error({
        message: `No product matching this id is found`,
      });
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (err) {
    const error = new Error(err.message);
    error.httpStatusCode = 500;
    next(error);
  }
});

route.delete("/:id", async (req, res, next) => {
  try {
    let productsInDB = await fs.readJSON(pathToProducts);
    const product = productsInDB.find(
      (product) => product.id === req.params.id
    );
    if (product) {
      productsInDB = productsInDB.filter(
        (product) => product.id !== req.params.id
      );
      await fs.writeJSON(pathToProducts, productsInDB);
      res.status(202).send("Product deleted from DB");
    } else {
      const error = new Error({
        message: `No product matching this id is found`,
      });
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (err) {
    const error = new Error(err.message);
    error.httpStatusCode = 500;
    next(error);
  }
});

route.post(
  "/:id/upload",
  multer().single("picture"),
  async (req, res, next) => {
    try {
      let productsInDB = await fs.readJSON(pathToProducts);
      const product = products.find((product) => product.id === req.params.id);
      if (product) {
        const pathToPicture = join(pathToPublicImages, req.file.originalname);
        await fs.writeFile(pathToPicture, req.file.buffer);

        const productObj = {
          ...product,
          imageUrl: `${req.protocol}://${req.hostname}:${process.env.PORT}/img/${originalname}`,
          updatedAt: new Date(),
        };

        productsInDB.push(productObj);
        await fs.writeJSON(pathToProducts, productsInDB);
        res.status(201).send(productObj);
      } else {
        const error = new Error({
          message: `No product matching this id is found`,
        });
        error.httpStatusCode = 404;
        next(error);
      }
    } catch (err) {
      const error = new Error();
      error.httpStatusCode = 500;
      next(error);
    }
  }
);

export default route;
