import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
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

    const {username, fullName, email, password} = req.body

    if(
        [fullName, username, email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(400, "User with username or email already exists");
    }

    const avatarImagePath = req.files?.avatar[0]?.path;
    // const coverImagePath = req.files?.coverImage[0]?.path;

    let coverImagePath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImagePath = req.files.coverImage[0].path;
    }

    // console.log(req.files);

    if(!avatarImagePath){
        throw new ApiError(400, "Avatar Image is required");
    }
    const avatar = await uploadOnCloudinary(avatarImagePath);
    const coverImage = await uploadOnCloudinary(coverImagePath);

    if(!avatar){
        throw new ApiError(500, "Avatar Image was not uploaded successfully - User not registered")
    }

    const user = await User.create({
        fullName : fullName,
        email : email,
        password : password,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        username : username.toLowerCase()
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


const generateAccessAndRefreshToken = async (user_id) => {
    try {
        const user = await User.findOne(user_id);
        const AccessToken = user.generateAccessToken();
        const RefreshToken = user.generateRefreshToken();

        user.refreshToken = RefreshToken;
        await user.save({validateBeforeSave : false});
    
        return {AccessToken, RefreshToken};
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

const loginUser = asyncHandler( async (req, res) => {
    // algo
    // req->body => data
    // find user by username or email
    // check if user eixst or not 
    // if user exists, check password
    // generate tokens
    // send them through cookies 
    
    const {username, email, password} = req.body;

    if(!(username || email)){
        return new ApiError(404, "username or email is required");
    }

    const user = await User.findOne(
        {$or : [{username}, {email}]}
    )

    if(!user){
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password); //bcyrpt takes time, thus await is used
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credential");
    }

    const {AccessToken, RefreshToken} = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findOne(user._id).select("-password -refreshToken");

    const options = { // cookies can be updated by backend only - security layer
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken", AccessToken, options)
    .cookie("refreshToken", RefreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                loggedInUser, AccessToken, RefreshToken
            },
            "User logged in Successfully"
        )
    )
})

const logoutUser = asyncHandler ( async(req, res) => {
    // remove refresh toeken from our db 
    // remove cookies as - managed by backend only 
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(200, {}, "User logged out successfully")
})

const refreshAccessToken = asyncHandler ( async (req, res) => {
    const incomingToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");

    if(!incomingToken){
        throw new ApiError(404, "Invalid token or refresh token expired")
    }

    try {
        const decodedToken = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id)
        
        if(!user){
            throw new ApiError(404, "unauthorized request");
        }
        console.log(user.refreshToken);
        if(user.refreshToken !== incomingToken){
            throw new ApiError(404, "Refresh token expired !!");
        }
    
        const {accessToken, newRefreshToken} = generateAccessAndRefreshToken(user._id);
    
        const options = {
            httpOnly : true,
            secure : true
        }
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            201,
            {
                accessToken, refreshToken : newRefreshToken 
            },
            "Tokens refreshed succesfully"
        )
    } catch (error) {
        throw new ApiError(404, error?.message || "Invalid token !!")
    }

})


export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}