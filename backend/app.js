import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { initializeApp } from 'firebase-admin/app';
import admin from 'firebase-admin'
import 'dotenv/config'

const SERVICE_ACCOUNT_KEY = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
    credential: admin.credential.cert(SERVICE_ACCOUNT_KEY)
});
const STORAGE_DIRECTORY = "./upload/"

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log(req.user);
        const destination = getUserStoragePath(req.user.uid);
        cb(null, destination);
    },

    filename: (req, file, cb) => {
        console.log("Filename")
        console.log(file);
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });
function getUserStoragePath(uid){
    return path.join(STORAGE_DIRECTORY, uid)
}

const app = express();

function initializeStorage(uid) {
    if (!fs.existsSync(getUserStoragePath(uid))) {
        console.log("User Storage doesn't exist. Creating user Storage")
        fs.mkdirSync(`./upload/${uid}`, (error) => {
            if (err) {
                console.error(`Error creating folder: ${err.message}`);
            } else {
                console.log(`Folder created successfully at ${folderPath}`);
            }
        });
    }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));
app.use(async (req, res, next) => {
    const token = req.headers.authorization
    if (token) {
        const decodedToken = await admin.auth().verifyIdToken(token.split(' ')[1]);
        req.user = decodedToken;
        initializeStorage(req.user.uid)
        console.log("User authenticated");
    }else {
        console.log("Auth Header: ", req.headers.authorization)
    }

    next();
})
app.get("/", (req, res) => {
    res.send("Hello World");
})

app.post("/test", (req, res) => {
    res.send("recieved");
})

app.get("/files-list", (req, res) => {
    const files_list = [];
    const destination = getUserStoragePath(req.user.uid);
    fs.readdir(destination, (err, files) => {
        console.log(err);
        files.forEach(file => {
            files_list.push({ ...fs.statSync(path.join(destination, file)), filename: file });
        })
        res.json(files_list);
    })
})

app.get("/files-list-count", (req, res) => {
    fs.readdir(STORAGE_DIRECTORY, (err, files) => {
        res.json({ file_count: files.length });
    })
})

app.post("/upload", upload.single('file'), (req, res) => {
    console.log("Uploading...")
    console.log(req.body);
    res.send("recieved");
})

app.get("/download/:filename", (req, res) => {
    const file = path.join(STORAGE_DIRECTORY, req.params.filename);
    res.download(file);
})

app.listen(3000, () => {
    console.log("App listening for requests ");
});

