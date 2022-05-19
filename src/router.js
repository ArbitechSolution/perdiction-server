const express = require("express");
const {startBatting} = require("./index");
const bodyParser = require("body-parser");
const router = express.Router();

router.use(bodyParser.urlencoded({extended:false}));
router.use(bodyParser.json());


router.route('/startBatting').get(startBatting);

module.exports = router;