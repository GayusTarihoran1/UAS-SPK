import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const {DataTypes} = Sequelize;

const User = db.define('user', {
    name: DataTypes.STRI,
    email: DataTypes.STRING,
    password: DataTypes.STRING
}, {
    freezeTableName:true
});

export default User;

(async()=>{
    await db.sync();
})();