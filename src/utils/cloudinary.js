import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import path from "path"

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        // uploading local file on cloudinary
        // const absolutePath = path.resolve(localFilePath);
        // console.log(absolutePath);
        const response  = await cloudinary.uploader.upload(localFilePath, {
            resource_type : 'auto'
        })
        // console.log(localFilePath);
        console.log("File is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
          console.error("Cloudinary upload error:", error);
        fs.unlinkSync(localFilePath) // since error has been encountered, 
        // the localFilePath is available but could be that the file is corrupted or malicious -  so better we unlink it
        return null;
    }
}

const deleteOnCloudinary = async(publicUrl) => {
    try {
        // getting public id from url 
        const parts = url.split("/upload/");
        if (parts.length < 2) return null;

        let publicIdWithExtension = parts[1].split("/").slice(1).join("/");
        const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, ""); // remove extension
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Delete result:", result);
    } 
    catch (error) {
        console.error("Cloudinary delete error: ", error);
    }

}

export {
    uploadOnCloudinary,
    deleteOnCloudinary
}