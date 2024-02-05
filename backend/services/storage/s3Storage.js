const { User, Folder, File, UserTier } = require("../../database/models");
const { Upload } = require('@aws-sdk/lib-storage');
const busboy = require('busboy');
const { v4 } = require('uuid');
const path = require("path");
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

const BUCKET = process.env.AWS_S3_BUCKET;
const s3 = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    }
})

async function saveFile(path, file) {
    const fileKey = v4();
    const upload = new Upload({
        client: s3,
        params: {
            Bucket: BUCKET,
            Key: `${path}/${fileKey}`,
            Body: file
        }
    });

    const response = await upload.done();
    response.fileKey = fileKey;
    return fileKey;
}

function store(req, cb) {
    const bb = busboy({ headers: req.headers });

    const { user } = req;
    const uid = user.uid;
    let filedir;
    let dirname;
    let foldername;
    let uploadProgress;

    bb.on('file', async (filename, bb_file, metadata) => {
        filename = metadata.filename;
        filedir = `/${uid}/${req.body.path || ''}`;
        dirname = path.dirname(filedir);
        foldername = path.basename(filedir);

        const up_res = await saveFile(filedir, bb_file)

        try {
            const metadata = {
                foldername,
                filename,
                dirname,
                filedir,
                location: up_res.Location,
                size: uploadProgress,
                s3_etag: up_res.ETag,
                s3_uid: up_res.fileKey
            }
            cb(up_res, metadata)
        } catch (err) {
            console.log(err);
            res.status(500).send("idk man");
        }

    });

    bb.on('finish', async (something) => {

    });

    req.pipe(bb);
}

function getUserStoragePath(uid) {
    return path.join(STORAGE_DIRECTORY, uid)
}

module.exports = {
    store
}