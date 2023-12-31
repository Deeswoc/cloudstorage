require('dotenv').config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { initializeApp } = require('firebase-admin/app');
const admin = require("firebase-admin");
const { Server } = require("socket.io");
const multerS3 = require("multer-s3");
const http = require("http");
const { User } = require("./database/models");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require('express-session');
const db = require('./database/models');
const PgStore = require('connect-pg-simple')(session);
const pg = require('pg');

// db.sequelize.sync({ force: true });
const {
    S3Client,
    PutObjectCommand,
    CreateBucketCommand,
    DeleteObjectCommand,
    DeleteBucketCommand,
    paginateListObjectsV2,
    GetObjectCommand,
    ListObjectsCommand,

} = require("@aws-sdk/client-s3");

const pgPool = new pg.Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
})

const sessConfig = {
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    store: new PgStore({
        pool: pgPool, 
        tableName: "session",
        createTableIfMissing: true
    }),
    resave: false,
}

passport.serializeUser(function (user, done) {
    // console.log("Serializing User: ", user);
    done(null, user.id);
});

passport.deserializeUser(async function (user, done) {
    try {
        console.log("Deserializing User...");
        const loggedInUser = await User.findByPk(user);
        done(null, loggedInUser)
    } catch (error) {
        done(error, null);
    }
});

passport.use(new LocalStrategy(
    {
        passwordField: 'token'
    },
    async function (username, token, done) {
        console.log("Signing IN WITH PASSPORT!!!");
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            let user = await User.findOne({ uid: decodedToken.uid });
            if (!user) {
                const firebaseUser = await admin.auth().getUser(decodedToken.uid);
                user = await User.create({
                    uid: decodedToken.uid,
                    displayname: firebaseUser.displayName
                })
            }
            return done(null, user)
        } catch (error) {
            console.log(error);
            return done(error)
        }
    }
))

const { Upload } = require("@aws-sdk/lib-storage");
const cookieParser = require('cookie-parser');
const s3 = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    }
})


const BUCKET = "afsdfojaosdpfasdlslse";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session(sessConfig));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

const server = http.createServer(app)
const io = new Server(server);

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
const upload = multer({
    storage: multerS3({
        s3,
        bucket: "afsdfojaosdpfasdlslse",
        metadata: async function (req, file, cb) {
            console.log("File being uploaded: ", file)
            cb(null, { fieldname: file.fieldname, test: [file.size] })
        },
        key: async function (req, file, cb) {
            if (req.user) {
                cb(null, `${req.user.uid}/${file.originalname}`);
            } else {
                console.log("Auth Header: ", req.headers.authorization)
            }
        }
    })
});
function getUserStoragePath(uid) {
    return path.join(STORAGE_DIRECTORY, uid)
}


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

// io.on('connection', (socket) => {
//     console.log('a user connected');
// });



app.get("/download/:uid/:filename", (req, res) => {
    const file = path.join(STORAGE_DIRECTORY, req.params.uid, req.params.filename);
    res.download(file);
})

app.post("/signin", passport.authenticate('local'), (req, res) => {
    res.sendStatus(200);
})

app.get("/", (req, res) => {
    res.send("Hello World");
})

app.post("/test", async (req, res) => {
    console.log("Request Body: ", req.body)
    res.send("recieved");
})

app.get("/test", async (req, res) => {
    try {
        console.log(req.user);
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})

app.get("/test/create-bucket/:bucket_name", async (req, res) => {

    let bucketName = req.params.bucket_name;
    let commandInput = {
        "Bucket": bucketName,
    }
    let command = new CreateBucketCommand(commandInput);
    try {

        let response = await s3.send(command);
        console.log("Response: ", response.$metadata);
        res.send("Bucket should be created");
    } catch (error) {
        console.log("Error: ", error);
        res.status(500).send("An error occoured");
    }
})

app.get("/test/create-file/:folder_name/:file_name", async (req, res) => {
    let bucketName = "afsdfojaosdpfasdlslse";
    let foldername = req.params.folder_name;
    let fileName = req.params.file_name;
    let commandInput = {
        "Bucket": bucketName,
        "Key": `${foldername}/new-test/${fileName}.txt`,
        "Body": "seeing if files are created automatically"
    }
    let command = new PutObjectCommand(commandInput);
    try {

        let response = await s3.send(command);
        console.log("Response: ", response.$metadata);
        res.send("file should be created");
    } catch (error) {
        console.log("Error: ", error);
        res.status(500).send("An error occoured");
    }
})

app.get("/test/create-folder/:folder_name", async (req, res) => {
    let bucketName = "afsdfojaosdpfasdlslse";
    let foldername = req.params.folder_name;
    let commandInput = {
        "Bucket": bucketName,
        "Key": `${foldername}/`
    }
    let command = new PutObjectCommand(commandInput);
    try {

        let response = await s3.send(command);
        console.log("Response: ", response.$metadata);
        res.send("Folder should be created");
    } catch (error) {
        console.log("Error: ", error);
        res.status(500).send("An error occoured");
    }
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

app.get("/folders", async (req, res) => {
    const folderPath = req.query.path;
    const fullFolderPath = path.join(req.user.uid, folderPath || '', '/');
    const input = {
        "Bucket": BUCKET,
        "Prefix": fullFolderPath
    }
    console.log("Path: ", fullFolderPath);
    const command = new ListObjectsCommand(input);
    const response = await s3.send(command);
    const folder = response.Contents.map((file) => {
        return {
            filename: file.Key,
            size: file.Size
        }
    })
    console.log("Response: ", response);
    res.status(200).send(folder);
})


app.get("/files-list-count", (req, res) => {
    fs.readdir(STORAGE_DIRECTORY, (err, files) => {
        res.json({ file_count: files.length });
    })
})



app.post("/upload", upload.single('file'), (req, res) => {
    // app.post("/upload", (req, res) => {
    const uid = req.user.uid;
    const event = {
        type: 'file',
        action: 'new',
        file: req.file,
        message: `${req.file.filename} has been uploaded`
    }
    io.sockets.emit(`event-${uid}`, { event });
    res.send("recieved");
})

app.delete("/delete/:filename", (req, res) => {
    const uid = req.user.uid;
    const event = {
        type: 'file',
        action: 'delete',
        filename: req.params.filename,
        message: `${req.query.filename} has been deleted`
    }
    const userDir = getUserStoragePath(uid);
    io.sockets.emit(`event-${uid}`, { event });
    fs.rmSync(path.join(userDir, req.params.filename));
    res.send('deleted');
})


server.listen(3000, () => {
    console.log("App listening for requests ");
});

