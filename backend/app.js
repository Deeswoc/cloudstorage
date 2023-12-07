import express from "express";
import multer from "multer";
import cors from "cors";

const upload = multer();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(upload.array()); 
app.use(cors()); 
app.use(express.static('public'));

app.get("/", (req, res)=>{
    res.send("Hello World");
})

app.post("/test", (req, res)=>{
    console.log(req.body);
    res.send("recieved");
})

app.get("/test", (req, res)=>{
    console.log("GET /test hit");
    res.send("GET /test hit");
})

app.post("/upload", (req, res)=>{
    console.log(req.body);
    res.send("recieved");
})

app.listen(3000, ()=>{
    console.log("App listening for requests ");
});