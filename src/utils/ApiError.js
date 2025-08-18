class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong", // by default message - although we will override it
        errors = [], // array for errors
        stack = ""
    ){
        super(message) // for overriding message
        this.statusCode = statusCode
        this.data = null
        this.message = message // override here
        this.success = false /// for frontend dev
        this.errors = errors

        if(stack){
            this.stack = stack // if we have then fill
        }
        else{
            Error.captureStackTrace(this, this.constructor) // to identify which files are problematic
        }
    }
}
export {ApiError}