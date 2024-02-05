const express = require("express");
const testController = require("../controllers/testController");

const testRouter = express.Router();
testRouter.get("/create-bucket/:bucket_name", testController.createBucket);
testRouter.get("/test/create-file/:folder_name/:file_name", testController.createFileOnPath);
