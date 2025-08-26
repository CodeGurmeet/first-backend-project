import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler( async (req,res) => {
    // to get user details from frontend 
    // validation - should be non empty fields
    // check if user already exists - by username and email
    // check for images, mainly check for avatar (required field)
    // upload them on cloudinary, check for avatar again (if it is successfully uploaded or not)
    // create user object - db
    // remove password and refresh token from response 
    // check if user creation was successfully
    // return response

    const {userName, fullName, email, password} = req.body

    if(
        [fullName, userName, email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or : [{userName}, {email}]
    })

    if(existedUser){
        throw new ApiError(400, "User with username or email already exists");
    }

    const avatarImagePath = req.files?.avatar[0]?.path;
    const coverImagePath = req.files?.coverImage[0]?.path;

    if(!avatarImagePath){
        throw new ApiError(400, "Avatar Image is required");
    }

    const avatar = await uploadOnCloudinary(avatarImagePath);
    const coverImage = await uploadOnCloudinary(avatarImagePath);

    if(!avatar){
        throw new ApiError(500, "Avatar Image was not uploaded successfully - User not registered")
    }

    const user = await User.create({
        fullName : fullName,
        email : email,
        password : password,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        username : username.toLowercase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "User is not registered")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

} )

export {registerUser}