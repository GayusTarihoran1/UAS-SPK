import express from "express";
import {getUsers, createUsers} from "../controllers/UserController.js";

const router = express.Router();

router.get('/users', getUsers);
router.post('/users', createUsers);

export default router;