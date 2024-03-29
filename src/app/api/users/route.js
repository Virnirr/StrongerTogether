import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { USER_NOT_SIGNED_IN } from "@/lib/response";
import { checkLoggedIn } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from "uuid";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.CLOUDINARY_SECRETS,
});

export async function GET() {
  // get all user data from the database who is not the current user
  // authenticate the user before returning the informations
  const loggedInData = await checkLoggedIn();
  if (loggedInData.loggedIn) {
    // find unique user that has the session id
    const userId = loggedInData.user.id;
    let Users;
    try {
      // check if it's an actual in the param or not:
      // find every user and their friendships and return it
      Users = await prisma.$queryRaw`
             WITH 
               "FriendsOngoing" AS (
                  (
                   SELECT "recipientId" AS "Friends"
                   FROM "Friendship"
                   WHERE "initiatorId" = ${userId} AND "status" = 'PENDING'
                 )
                UNION
                 (                
                   SELECT "initiatorId" AS "Friends"
                   FROM "Friendship"
                   WHERE "recipientId" = ${userId} AND "status" = 'PENDING'
                 )
               ),
               "FriendsAccepted" AS (
                  (
                    SELECT "recipientId" AS "Friends"
                    FROM "Friendship"
                    WHERE "initiatorId" = ${userId} AND "status" = 'ACCEPTED'
                  )
                  UNION
                  (                
                    SELECT "initiatorId" AS "Friends"
                    FROM "Friendship"
                    WHERE "recipientId" = ${userId} AND "status" = 'ACCEPTED'
                  )
                )
              SELECT "User"."name", "User"."id", "User"."ProfileImage", "User"."status",
                    CASE 
                    WHEN "User"."id" IN (SELECT "FriendsOngoing"."Friends" FROM "FriendsOngoing") THEN 'PENDING' 
                    WHEN "User"."id" IN (SELECT "FriendsAccepted"."Friends" FROM "FriendsAccepted") THEN 'ACCEPTED' ELSE 'NONE' 
                    END AS "friendshipStatus"
              FROM "User"
              WHERE "User"."id" != ${userId};
           `;
    } catch (e) {
      console.log(e.message);
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    console.log(Users);
    return NextResponse.json(Users);
  }
  return USER_NOT_SIGNED_IN;
}

export async function POST(request) {
  /**
   * Overview: take in a request from a form and
   */
  const responseData = await request.json();
  const { name, email, password } = responseData;
  if (name && email && password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name: name,
          password: hashedPassword,
          email: email,
        },
      });
    } catch (e) {
      console.log(e.message);
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json(user);
  }
  return USER_NOT_SIGNED_IN;
}

const uploadToCloudinary = async (imageURL) => {
  // create the image with a public_id as uuidv4()
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      imageURL,
      {
        public_id: uuidv4(),
        height: 150,
        width: 150,
        crop: "fill",
        quality: "auto",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
};

const destroyCloudinary = async (public_id) => {
  // destroys the image using the public_id from the image
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(public_id).then((error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};

function extractAfterLastSlashAndBeforeDot(str) {
  // Find the index of the last occurrence of '/'
  const lastIndexSlash = str.lastIndexOf("/");

  // If '/' is not found, return an empty string or the whole string
  if (lastIndexSlash === -1) return str;

  // Extract the substring after the last '/'
  const substringAfterSlash = str.substring(lastIndexSlash + 1);

  // Find the index of the first occurrence of '.' in the substring
  const lastIndexDot = substringAfterSlash.indexOf(".");

  // If '.' is not found, return the whole substring
  if (lastIndexDot === -1) return substringAfterSlash;

  // Extract and return the substring before the '.'
  return substringAfterSlash.substring(0, lastIndexDot);
}

const checkImageExist = async (userId) => {
  // check if image exist, return image URL if it does, else NULL
  try {
    const imageToDelete = await prisma.User.findUnique({
      where: {
        id: userId,
      },
    });
    if (imageToDelete?.ProfileImage)
      return extractAfterLastSlashAndBeforeDot(imageToDelete?.ProfileImage);
    else return null;
  } catch (e) {
    console.log(e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
};

export async function PUT(request) {
  // delete events and cascade delete all the event attendees
  const loggedInData = await checkLoggedIn();
  if (loggedInData.loggedIn) {
    const responseData = await request.json();
    const userId = loggedInData.user.id;
    const { name, shortBio, status, ProfileImage, gymFrequency } = responseData;
    const eventData = {
      name,
      shortBio,
      status,
      ProfileImage,
      gymFrequency,
    };
    // delete image if it already exist in prisma/postgresql database
    const imageToDelete = await checkImageExist(userId);
    if (imageToDelete) destroyCloudinary(imageToDelete);

    // create image using Cloudinary API
    const cloudinaryResult = await uploadToCloudinary(ProfileImage);
    eventData.ProfileImage = cloudinaryResult.url; // get the url created from the api to save into database
    let updatdUser;
    try {
      updatdUser = await prisma.User.update({
        where: {
          id: userId,
        },
        data: eventData,
      });
    } catch (e) {
      console.log(e.message);
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json(updatdUser);
  }
  return USER_NOT_SIGNED_IN;
}
