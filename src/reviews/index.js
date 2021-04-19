import express from "express";
import uniqid from "uniqid";
import { check, validationResult } from "express-validator";
import {
  getReviews,
  writeReviews,
  getProducts,
} from "../lib/fs-tools-review.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const reviews = await getReviews();
    console.log(req.body);
    res.status(200).send(reviews);
  } catch (error) {
    console.log(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const reviews = await getReviews();

    const review = reviews.find((review) => review._id === req.params.id);

    if (!review) {
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }

    res.send(review);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post(
  "/",
  [
    check("comment")
      .exists()
      .withMessage("please insert your comment this is important for us"),
    check("rate")
      .isInt()
      .withMessage("it has to be a number")
      .exists()
      .withMessage("please give it a shoot from 1 to 5"),
    check("productId").exists().withMessage("please insert productId"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error();
        err.errorList = errors;
        err.httpStatusCode = 400;
        next(err);
      } else {
        const reviews = await getReviews();
        const newReview = { ...req.body, _id: uniqid(), createdAt: new Date() };

        reviews.push(newReview);

        await writeReviews(reviews);

        res.status(201).send(newReview);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

router.put("/:id", async (req, res, next) => {
  try {
    const reviews = await getReviews();

    const newReviewsArray = reviews.filter(
      (review) => review._id !== req.params.id
    );

    const modifiedReview = {
      ...req.body,
      _id: req.params.id,
    };

    newReviewsArray.push(modifiedReview);
    await writeReviews(newReviewsArray);

    res.status(201).send(modifiedReview);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const reviews = await getReviews();
    const newReviewsArray = reviews.filter(
      (review) => review._id !== req.params.id
    );
    await writeReviews(newReviewsArray);
    res.status(204).send("its gone");
  } catch (error) {
    console.log(error);
  }
});

export default router;
