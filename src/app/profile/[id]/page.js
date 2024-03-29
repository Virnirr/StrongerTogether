"use client";
import * as React from "react";
import { useState } from "react";
import "../profile.css";
//import '../globals.css';

import {
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  Avatar,
  InputLabel,
  NativeSelect,
  Drawer,
  Box,
  IconButton,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

import List from "@mui/material/List";
import Divider from "@mui/material/Divider";

export default function Profile({ params }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPrivate, setPrivate] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState("");
  const [experience, setExperience] = useState("No experience set");
  // const [errorMessage, setErrorMessage] = useState("");
  const [HostEvents, setEvent] = useState([]);
  const [postCreated, setPostCreated] = useState([]);
  const [friendPending, setFriendPending] = useState([]);
  const [friends, setFriends] = useState([]);

  //drawer defs
  const [state, setState] = React.useState({
    right: false,
  });

  const toggleDrawer = (anchor, open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setState({ ...state, [anchor]: open });
  };

  // TODO: add useState for interested in, upcoming events, forum activities
  const { data: session, status } = useSession();
  let currentUserId = session?.user?.id; // current userID
  let { id: userId } = params;
  userId = parseInt(userId);
  // console.log("currentUsrId", currentUserId);
  // console.log("UsrId", userId);
  // console.log(
  //   JSON.stringify(
  //     {
  //       name,
  //       bio,
  //       photo,
  //       experience,
  //       HostEvents,
  //       postCreated,
  //       friendPending,
  //       friends,
  //     },
  //     null,
  //     2
  //   )
  // );

  function formatISO8601ToDateOnly(isoString) {
    const date = new Date(isoString);

    // Getting components of the date
    const months = [
      "Jan.",
      "Feb.",
      "March",
      "April",
      "May",
      "June",
      "July",
      "Aug.",
      "Sept.",
      "Oct.",
      "Nov.",
      "Dec.",
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    // Combine the date components
    return `${month} ${day}, ${year}`;
  }

  function formatISO8601ToTimeOnly(isoString) {
    const date = new Date(isoString);

    // Formatting the time in 12-hour format with AM/PM
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    // Combine the time components
    return `${hours}:${minutes}${ampm}`;
  }

  // console.log(friends);
  const fetchFriends = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "GET",
      });
      if (response.ok) {
        const userData = response.json();
        return userData;
      } else {
        console.error("Failed to get user data");
      }
    } catch (error) {
      console.error("Failed to fetch [user]:", error);
    }
  };

  const handleAcceptFriendRequest = async (userId) => {
    // console.log("USER ID", userId)
    try {
      const response = await fetch(`/api/friendship/`, {
        method: "PUT",
        body: JSON.stringify({
          initiatorId: userId,
        }),
      });
      if (response.ok) {
        const acceptedFriend = await response.json();
        setFriendPending((prevFriendPending) => {
          return prevFriendPending.filter(
            (pendingFriend) => pendingFriend.id !== userId
          );
        });
        setFriends((prevFriends) => {
          return [...prevFriends, acceptedFriend?.initiator]
        })
      } else {
        console.error("Failed to accept friend request or server error");
      }
    } catch (error) {
      console.error("Failed to fetch [user]:", error);
    }
  };
  const handleDeclineFriendRequest = async (userId) => {
    try {
      const response = await fetch(`/api/friendship/`, {
        method: "DELETE",
        body: JSON.stringify({
          friendId: userId,
        }),
      });
      if (response.ok) {
        const message = await response.json();
        console.log(message.message);
        setFriendPending((prevFriendPending) => {
          return prevFriendPending.filter(
            (pendingFriend) => pendingFriend.id !== userId
          );
        });
      } else {
        console.error("Failed to accept friend request or server error");
      }
    } catch (error) {
      console.error("Failed to fetch [user]:", error);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "GET",
        });
        if (response.ok) {
          const userData = await response.json();
          const {
            name,
            shortBio,
            ProfileImage,
            gymFrequency,
            status,
            email,
            HostEvents,
            Post,
            initiatedFriendships,
            receivedFriendships,
          } = userData;
          const combinedFriends = [
            ...initiatedFriendships,
            ...receivedFriendships,
          ];
          // const pendingFriends = receivedFriendships.map(
          //   (friend) => friend["initiatorId"]
          const pendingFriends = receivedFriendships
            .filter((friend) => friend["status"] === "PENDING")
            .map((friend) => friend?.recipientId ?? friend?.initiatorId);
          // console.log("pendingFriends: ", pendingFriends);
          const acceptedFriends = combinedFriends
            .filter((friend) => friend["status"] === "ACCEPTED")
            .map((friend) => friend?.recipientId ?? friend?.initiatorId);
          setName(name);
          setBio(shortBio);
          setPhoto(ProfileImage);
          setPrivate(status === "PRIVATE" ? true : false);
          setExperience(gymFrequency ?? "No experience set");
          //setFriendPending(pendingFriends);
          // setFriends(acceptedFriends);
          setEvent(HostEvents);
          setPostCreated(Post);

          // console.log(friendPending.length);

          Promise.all(pendingFriends.map(fetchFriends)).then((listOfUsers) => {
            // console.log("What ist his: ", listOfUsers);
            const pendingFriends = listOfUsers.map((user) => ({
              id: user.id,
              name: user.name,
              ProfileImage: user.ProfileImage,
            }));
            setFriendPending(pendingFriends);
          });

          if (acceptedFriends.length > 0) {
            Promise.all(acceptedFriends.map(fetchFriends)).then(
              (listOfUsers) => {
                const actualFriends = listOfUsers.map((user) => ({
                  id: user.id,
                  name: user.name,
                  ProfileImage: user.ProfileImage,
                }));
                setFriends(actualFriends);
              }
            );
          }
        } else {
          console.error("Failed to get user data");
        }
      } catch (error) {
        console.error("Failed to fetch [user]:", error);
      }
    };
    fetchProfile();
  }, [userId]);

  const customButtonStyle = {
    backgroundColor: "#003831",
    color: "white",
  };

  const handleSaveProfile = async () => {
    try {
      let base64photo;
      // takes the image and turns it into a blob and sends it to the backend to put into cloud
      fetch(photo)
        .then((response) => response.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async function () {
            base64photo = reader.result;
            const response = await fetch("/api/users", {
              method: "PUT",
              body: JSON.stringify({
                name,
                shortBio: bio,
                status: isPrivate ? "PRIVATE" : "PUBLIC",
                ProfileImage: base64photo,
                gymFrequency: experience,
              }),
            });
            if (response.ok) {
              console.log("Success", response);
            }
          };
        });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleBioChange = async (e) => {
    setBio(e.target.value);
  };

  const handlePhotoChange = (e) => {
    const selectedPhoto = e.target.files[0];
    // console.log(selectedPhoto);
    setPhoto(URL.createObjectURL(selectedPhoto));
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const toggleStatus = () => {
    setPrivate(!isPrivate);
  };

  const handleExperienceChange = (e) => {
    setExperience(e.target.value);
  };

  const list = (anchor) => (
    <Box
      sx={{ width: anchor === "top" || anchor === "bottom" ? "auto" : 250 }}
      role="presentation"
      onClick={toggleDrawer(anchor, false)}
      onKeyDown={toggleDrawer(anchor, false)}
    >
      <div className="friendRequests">
        <center>Pending Friend Requests</center>
      </div>
      <Divider />
      <List>
        {friendPending.map((friend, index) => (
          <div key={index} className="friend">
            <center>
              <Button
                href={`/profile/${friend.id}`}
                style={{ textTransform: "none" }}
              >
                <Avatar
                  alt="Profile"
                  src={friend.ProfileImage}
                  sx={{ width: 20, height: 20, marginRight: 1 }}
                />
                {friend.name}
              </Button>
              <IconButton aria-label="Accept" style={{ color: "#27632a" }} onClick={() => {
                handleAcceptFriendRequest(friend.id)
              }}>
                <CheckIcon />
              </IconButton>
              <IconButton aria-label="Decline" style={{ color: "#d32f2f" }} onClick={() => {
                handleDeclineFriendRequest(friend.id)
              }}>
                <CloseIcon />
              </IconButton>
            </center>
          </div>
        ))}
      </List>
    </Box>
  );

  return (
    <div className="background">
      <div className="profile-container">
        <div className="profile-form">
          <div className="top-right">
            {userId === currentUserId
              ? [<PersonAddIcon key={userId} style={{ color: "#003831" }} />].map(
                  (anchor) => (
                    <>
                      <Button onClick={toggleDrawer(anchor, true)}>
                        {anchor}
                      </Button>
                      <Drawer
                        anchor="right"
                        open={state[anchor]}
                        onClose={toggleDrawer(anchor, false)}
                      >
                        {list(anchor)}
                      </Drawer>
                    </>
                  )
                )
              : null}
          </div>
          <div className="profile-photo">
            <center>
              <Avatar
                alt="Profile"
                src={photo}
                sx={{ width: 150, height: 150 }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
                id="photo-upload"
              />
              {isEditing && (
                <label htmlFor="photo-upload">
                  <Button
                    className="spacing"
                    variant="contained"
                    color="primary"
                    component="span"
                    size="small"
                    style={customButtonStyle}
                    startIcon={<PhotoCamera />}
                  >
                    Upload Photo
                  </Button>
                </label>
              )}
              {currentUserId === userId ? (
                <div>
                  <Button
                    className="spacing"
                    variant="text"
                    onClick={() => {
                      toggleEditing();
                      console.log("editing", isEditing);
                      isEditing ? handleSaveProfile() : null;
                    }}
                    size="small"
                  >
                    {isEditing ? "Save" : "Edit"}
                  </Button>
                </div>
              ) : null}
            </center>
          </div>
          <div className="profile-info">
            <div className={`profile-name ${isEditing ? "editing" : ""}`}>
              {isEditing ? (
                <TextField
                  className="font"
                  label="Your Name"
                  size="normal"
                  value={name}
                  onChange={handleNameChange}
                  margin="normal"
                />
              ) : (
                <div className="font">
                  <b>{name}</b>
                </div>
              )}
            </div>
            <div className={`profile-bio ${isEditing ? "editing" : ""}`}>
              {isEditing ? (
                <TextField
                  placeholder="Short Bio"
                  minRows={4}
                  value={bio}
                  onChange={handleBioChange}
                  margin="normal"
                />
              ) : (
                bio
              )}
            </div>
            <div className="profile-status">
              {isEditing ? (
                <Button
                  className="spacing"
                  variant="contained"
                  onClick={isEditing ? toggleStatus : null}
                  size="small"
                  style={customButtonStyle}
                >
                  {isPrivate ? "Private" : "Public"}
                </Button>
              ) : (
                <item>
                  <b>{isPrivate ? "Private" : "Public"}</b>
                </item>
              )}
            </div>
          </div>
          <div className="middle">
            <div className="gym-frequency">
              <b>
                <p>Gym frequency:</p>
              </b>
              {isEditing ? (
                <FormControl variant="filled">
                  <InputLabel
                    variant="standard"
                    defaultValue={"experience"}
                    htmlFor="uncontrolled-native"
                  ></InputLabel>
                  <div className="select-wrapper">
                    <NativeSelect
                      onChange={handleExperienceChange}
                      defaultValue={experience} // fixed the edit bug
                      inputProps={{
                        name: "Frequency",
                        id: "uncontrolled-native",
                      }}
                    >
                      <option className="option-frequency">
                        No experience
                      </option>
                      <option className="option-frequency">
                        1 time a week
                      </option>
                      <option className="option-frequency">
                        2-3 times a week
                      </option>
                      <option className="option-frequency">
                        4-5 times a week
                      </option>
                      <option className="option-frequency">EVERY DAY</option>
                    </NativeSelect>
                  </div>
                </FormControl>
              ) : (
                experience
              )}
            </div>
            <div className="bottom-cards-container">
              <Card>
                <CardContent>
                  <div className="interested-in">
                    <center>
                      <b>
                        <p>Friends With</p>
                      </b>
                    </center>
                    <div className="eventContent">
                      {friends.map((friend, index) => (
                        <div key={index} className="friend">
                          <Button
                            href={`/profile/${friend.id}`}
                            style={{ textTransform: "none" }}
                          >
                            <Avatar
                              alt="Profile"
                              src={friend.ProfileImage}
                              sx={{ width: 20, height: 20, marginRight: 1 }}
                            />
                            {friend.name}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div className="upcoming-event">
                    <center>
                      <b>
                        <p>Upcoming Hosted Events</p>
                      </b>
                    </center>
                    <div className="eventContent">
                      {HostEvents.map((event, index) => (
                        <>
                          <div className="title">{event.eventName}</div>
                          <div className="body">Location: {event.location}</div>
                          <div className="body">
                            Date: {formatISO8601ToDateOnly(event.startTime)}
                          </div>
                          <div className="body">
                            Time: {formatISO8601ToTimeOnly(event.startTime)}-
                            {formatISO8601ToTimeOnly(event.endTime)}{" "}
                          </div>
                        </>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div className="forum-activity">
                    <center>
                      <b>
                        <p>Forum Activity</p>
                      </b>
                      <div className="eventContent">
                        {postCreated.map((post, index) => (
                          <>
                            <div className="title"> {post.postTitle}</div>
                            <div className="body">
                              {" "}
                              {formatISO8601ToDateOnly(post.createdAt)} @
                              {formatISO8601ToTimeOnly(post.createdAt)}
                            </div>
                          </>
                        ))}
                      </div>
                    </center>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
