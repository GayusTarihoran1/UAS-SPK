import {Sequelize} from "sequelize";

const db = new Sequelize('ahprank', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

export default db;