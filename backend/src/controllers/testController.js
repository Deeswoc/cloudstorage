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

function getTestController(){
    return {
        createBucket: async function (req, res){
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
        }
    }
}

module.exports = getTestController();