"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
function connectToDb() {
    return (0, mongoose_1.connect)(`${process.env.MONGO_URI}`)
        .then(() => {
        console.log("Connected to MongoDB");
    }).catch((err) => {
        console.log("Error connecting to MongoDB: ", err);
    });
}
exports.default = connectToDb;
//# sourceMappingURL=db.js.map