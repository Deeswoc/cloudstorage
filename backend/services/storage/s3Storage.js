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

function store(req, cb) {
    const bb = busboy({ headers: req.headers });
    const fileKey = v4();
    const { user } = req;
    const uid = user.uid;
    let filename;
    let filenameArr;
    let filedir;
    let dirname;
    let foldername;
    let uploadProgress;

    bb.on('file', (filename, bb_file, metadata) => {
        filename = metadata.filename;
        filedir = `/${uid}/${req.body.path || ''}`;
        dirname = path.dirname(filedir);
        foldername = path.basename(filedir);

        const upload = new Upload({
            client: s3,
            params: {
                Bucket: BUCKET,
                Key: `${uid}/${fileKey}`,
                Body: bb_file
            }
        });

        upload.on('httpUploadProgress', (progress) => {
            uploadProgress = progress.loaded;
            console.log(`Loaded ${progress.loaded} of ${progress.total}`)
        })


        upload.done().then((up_res) => {
            const metadata = {
                foldername,
                filename,
                dirname,
                filedir,
                location: up_res.Location,
                size: uploadProgress,
                s3_etag: up_res.ETag,
                s3_uid: fileKey
            }
            cb(up_res, metadata)
        }).catch((err) => {
            console.log(err);
            res.status(500).send("idk man");
        })
    });

    bb.on('finish', async (something) => {

    });

    bb.on('field', () => {
        console.log("Field thingy called");
    })

    req.pipe(bb);
}

function getUserStoragePath(uid) {
    return path.join(STORAGE_DIRECTORY, uid)
}

module.exports = {
    store
}