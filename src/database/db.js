const mongoose = require("mongoose");
const MongoClient = require('mongodb').MongoClient;
const URL = "mongodb://localhost:27017/MyDb";
 const connection=async()=>{
try{
mongoose.connect(URL,{
    useNewUrlParser:true,
})
console.log("Database connect successfully");

}
catch(e){
console.error("error while connected db", e);
}
 }

 module.exports=connection;