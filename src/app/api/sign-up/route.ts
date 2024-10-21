import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs"

import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";


export async function POST (request:Request) 
{
    await dbConnect;
    
    try {
        const {username,email,password}=await request.json()
        const existingUserVerifiedByUsername= await UserModel.findOne({
            username,
            isVerified:true
        })

        if(existingUserVerifiedByUsername){
            return Response.json({
                success: false,
                message:"username already taken"
            },{status:500})
        }


        const existingUSerByEmail= await UserModel.findOne({email})\
        const verifyCode=Math.floor(100000+Math.random()*900000).toString()

        if(existingUSerByEmail){
            if(existingUSerByEmail.isVerified){
                return Response.json({
                    success:false,
                    message:"user already exist with this email"
                },{status:400})

            }
            else{
                const hashedPassword= await bcrypt.hash(password,10)
                existingUSerByEmail.password=hashedPassword
                existingUSerByEmail.verifyCode=verifyCode
                existingUSerByEmail.verifyCodeExpiry=new Date(Date.now()+3600000)

                await existingUSerByEmail.save()


            }

        }
        else{
            const hashedPassword= await bcrypt.hash(password,10)
            const expiryDate= new Date()
            expiryDate.setHours(expiryDate.getHours()+1)

            const newUser = new UserModel({
                username,
                email,
                password:hashedPassword,

                verifyCode,
                verifyCodeExpiry:expiryDate,
                isAcceptingMessage:true,
                isVerified:false,
                messages:[]
            })

            await newUser.save()

        }

        const responseEmail= await sendVerificationEmail(
            email,
            username,verifyCode
        )

        if(!responseEmail.success){
            return Response.json({
                success:false,
                message:responseEmail.message
            },{status:500})
        }

        return Response.json({
            success:true,
            message:"user registered succesfully ..please verify your email"


        },{status:201})

    } catch (error) {
        console.error("error registering user",error)
        return Response.json(
            {
                success:false,
                message:"error registering user "
            },
            {
                status:500
            }
        )
        
    }
}