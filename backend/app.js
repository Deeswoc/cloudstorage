require('dotenv').config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const { Server } = require("socket.io");
const http = require("http");
const { User, Folder, File, UserTier } = require("./database/models");
const passport = require("./auth/passportConfig");
const session = require('express-session');
const { Op } = require("sequelize");
const db = require("./database/models");
const PgStore = require('connect-pg-simple')(session);
const pg = require('pg');

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

const cookieParser = require('cookie-parser');
const { store } = require('./services/storage/s3Storage');
const { default: helmet } = require('helmet');
const s3 = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    }
})

const testRouter = express.Router();
const profileRouter = express.Router();
const fileRouter = express.Router();
const folderRouter = express.Router();
const authRouter = express.Router();

const BUCKET = process.env.AWS_S3_BUCKET;
const app = express();
app.use(helmet())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session(sessConfig));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

const server = http.createServer(app)
const io = new Server(server);
const iOnotifications = io.of('/notifications');
const SERVICE_ACCOUNT_KEY = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
    credential: admin.credential.cert(SERVICE_ACCOUNT_KEY)
});

const api = express.Router();
app.use('/api', api);


authRouter.post("/signin", passport.authenticate('local'), (req, res) => {
    const { user } = req;
    res
        .cookie("name", user.displayname)
        .cookie("signed_in", 1)
        .sendStatus(200);
})

api.get("/", (req, res) => {
    res.send("Hello World");
})

api.use("/", authRouter);
api.use("/test", testRouter);
api.use("/profile", profileRouter);
api.use("/files", fileRouter);
api.use("/folders", folderRouter);

testRouter.post("/", async (req, res) => {
    console.log("Request Body: ", req.body)
    res.send("recieved");
})

testRouter.get("/", async (req, res) => {
    try {
        console.log(req.user);
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})

testRouter.get("/create-bucket/:bucket_name", async (req, res) => {

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

testRouter.get("/test/create-file/:folder_name/:file_name", async (req, res) => {
    let bucketName = "folderjam";
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

profileRouter.get("/info", async (req, res) => {
    if (req.isAuthenticated()) {
        const { user } = req;
        const tier = await user.getUserTier();
        res.send({
            displayname: user.displayname,
            profile_photo: user.profile_photo,
            uid: user.uid,
            used_space: user.used_space,
            tier: {
                name: tier.name,
                space_allotted: tier.space_allotted
            }
        })
    }
});

authRouter.post("/logout", (req, res, next) => {
    req.logOut(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    })
})

testRouter.get("/test/create-folder/:folder_name", async (req, res) => {
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

async function checkSpace(req, res, next) {
    const tier = await req.user.getUserTier();
    const storage = tier.space_allotted;
    const usedSpace = req.user.used_space;
    const freeSpace = storage - usedSpace;
    const approxFileSize = req.headers['content-length'];

    if (freeSpace < approxFileSize) {
        return res.sendStatus(507);
    }

    next();
}

fileRouter.post("/upload", checkAuth, checkSpace, async (req, res) => {
    async function uploadDone(up_res, metadata) {
        const { user } = req;
        const folder = await Folder.findOne({
            where: {
                name: metadata.foldername,
                path: metadata.dirname,
            }
        })

        const filenameArr = metadata.filename.split('.');

        const filenameQuery = `${filenameArr[0]}%${('.' + filenameArr[1]) || ''}`;

        const clashingFiles = await folder.getFiles({
            where: {
                name: {
                    [Op.like]: filenameQuery
                }
            }
        })

        const file = await folder.createFile({
            name: `${filenameArr[0]}${clashingFiles?.length > 0 ? ` (${clashingFiles.length})` : ''}.${filenameArr[1]}`,
            path: metadata.filedir,
            location: up_res.Location,
            size: metadata.size,
            s3_etag: up_res.ETag,
            s3_uid: metadata.s3_uid,
        })

        user.addFile(file);
        user.used_space = BigInt(user.used_space) + BigInt(metadata.size)
        user.save();
        const event = {
            type: 'file',
            action: 'new',
            message: `${metadata.filename} has been uploaded`,
            file: file
        }
        iOnotifications.sockets.emit(`event-${user.uid}`, event);
        res.send("recieved");
    }

    store(req, uploadDone);
});

fileRouter.get("/:id", async (req, res) => {
    const { id } = req.params;
    const { user } = req;
    const { download } = req.query;
    if (user) {
        const file = await File.findByPk(id);
        const check = await user.hasFile(file);
        console.log("check", check);
        if (check) {
            if (file) {
                try {

                    if (download) {
                        const command = new GetObjectCommand({
                            Bucket: BUCKET,
                            Key: `${user.uid}/${file.s3_uid}`,
                        });

                        res.setHeader('Content-Length', file.size);

                        const s3Res = await s3.send(command);
                        res.attachment(file.name);
                        s3Res.Body.pipe(res);

                        s3Res.Body.on('error', (err) => {
                            console.error(err);
                            res.status(500).send('Internal Server Error');
                        });
                        return
                    }

                } catch (err) {
                    console.log("Error trying to stream file to client:\n", err);
                    return res.sendStatus(500);
                }

                return res.send({
                    id: file.id,
                    path: file.path,
                    size: file.size,
                    createdAt: file.createdAt
                })
            }
        }
    }
    res.sendStatus(401);
})

fileRouter.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const { user } = req
    if (user) {

        try {
            const file = await File.findByPk(id);
            const check = await user.hasFile(file);
            if (check) {
                if (file) {
                    const command = new DeleteObjectCommand({
                        Bucket: BUCKET,
                        Key: `${user.uid}/${file.s3_uid}`
                    })

                    const s3Res = await s3.send(command);
                    if (s3Res) {
                        user.used_space = BigInt(user.used_space) - BigInt(file.size);
                        const deletedFile = await file.destroy();
                        user.save();
                        return res.status(200).send(file);
                    }
                } else {
                    return res.sendStatus(404);
                }
            }
        } catch (err) {
            console.log("Error", err);
            return res.sendStatus(500);
        }
    }
    return res.sendStatus(401);
})

folderRouter.get("/", async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const { user } = req;
            const folder = (await user.getFolders({ where: { path: '/' } }))[0];
            const contents_files = await folder.getFiles();
            const contents_folders = await folder.getFolders();
            res.status(200).send([...contents_files, ...contents_folders]);
        } catch (error) {
            console.error(error);
            res.status(500).send(error);
        }
    }
})

folderRouter.get("/:fpath(*)", async (req, res) => {
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


folderRouter.get("/count", (req, res) => {
    fs.readdir(STORAGE_DIRECTORY, (err, files) => {
        res.json({ file_count: files.length });
    })
})

function checkAuth(req, res, next) {

    if (req.isAuthenticated()) {
        return next();
    } else {
        res.sendStatus(401);
    }
}

function uploadFile(dependencies){

    return async (req, res)=>{

    }
}

const defaultTiers = [
    { name: 'free', space_allotted: 1024 * 1024 * 512 },
    { name: 'demo', space_allotted: 1024 * 1024 * 1024 },
    { name: 'bread', space_allotted: 1024 * 1024 * 1024 * 69 }
]

async function startServer(syncDb) {
    if (syncDb) {
        await db.sequelize.sync({ force: true });
    }
    const tiers = await UserTier.findAll()

    if (!tiers || tiers.length === 0) {
        await UserTier.bulkCreate(defaultTiers)
    }
    server.listen(3000, () => {
        console.log("App listening for requests ");
    })
}

startServer();