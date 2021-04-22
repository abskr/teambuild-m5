import { Router } from "express";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import fs from "fs-extra";
import uniqid from "uniqid";
import multer from "multer";
import { pipeline } from "stream"
import { Transform } from "json2csv"

const router = Router();

const pathToProducts = join(
  dirname(fileURLToPath(import.meta.url)),
  "../jsondata/products.json"
);
console.log({ pathToProducts });

const pathToPublicImages = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../public/img"
);

console.log({ pathToPublicImages });

router.get("/", async (req, res, next) => {
  try {
    const products = await fs.readJSON(pathToProducts);
    if( req.query && req.query.category) {
      const filteredProducts = products.filter(product => product.hasOwnProperty("category") && product.category === req.query.category)
      if (!filteredProducts) {
        const err = new Error("This category not found!")
        err.htmlStatusCode = 404
        next(err)
      }
      res.status(200).send(products)
    } else {
      res.status(200).send(products);
    }
  } catch (err) {
    const error = new Error(err.message);
    error.httpStatusCode = 500;
    next(error);
  }
});

router.get('/exportToCSV', (req, res, next) => {
  try {
    const fields = ['name', 'brand', 'description', 'price']
    const opts = {
      fields
    }
    const json2csv = new Transform(opts)
    res.setHeader("Content-Disposition", "attachment; filename=export.csv")
    const products = fs.createReadStream(pathToProducts)
    pipeline(products, json2csv, res, err => {
      if (err) {
        console.log(err)
        next(err)
      }
    })
  } catch (error) {
    console.log(error)
    next(error)
  }
})

router.get("/:name", async (req, res, next) => {
  try {
    const pathToPicture = join(pathToPublicImages, req.params.name);
    const picture = await fs.readFile(pathToPicture);
    res.attachment(req.params.name);
    res.send(picture);
  } catch (err) {
    const error = new Error(err.message);
    error.httpStatusCode = 500;
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
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

router.post("/", async (req, res, next) => {
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

router.put("/:id", async (req, res, next) => {
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

router.delete("/:id", async (req, res, next) => {
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

router.post(
  "/:id/upload",
  multer().single("picture"),
  async (req, res, next) => {
    console.log("HERE");
    try {
      let productsInDB = await fs.readJSON(pathToProducts);
      const product = productsInDB.find(
        (product) => product.id === req.params.id
      );
      if (product) {
        const pathToPicture = join(pathToPublicImages, req.file.originalname);

        await fs.writeFile(pathToPicture, req.file.buffer);
        const productObj = {
          ...product,
          imageUrl: `${req.protocol}://${req.hostname}:${process.env.PORT}/${req.file.originalname}`,
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
      const error = new Error();
      error.httpStatusCode = 500;
      next(error);
    }
  }
);



export default router;
