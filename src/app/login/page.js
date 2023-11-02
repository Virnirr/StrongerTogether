"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

export default function LoginPage() {
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const [isRegistering, setIsRegistering] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");

  const validatePassword = () => {
    const isValid = password.length >= 8;
    setIsPasswordValid(isValid);

    return isValid && password === confirmPassword;
  };

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit code
  };

  const verifyCode = () => {
    if (enteredCode === verificationCode) {
      console.log("Code verified!");
    } else {
      console.error("Incorrect code.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#333",
      }}
    >
      <Card
        sx={{ width: "70%", height: 650, borderRadius: 3, overflow: "hidden" }}
      >
        <Box sx={{ display: "flex", height: "100%" }}>
          <Box
            sx={{
              flex: "1 1 50%",
              height: "100%",
              backgroundImage: 'url("/images/CalPolyComplete.jpg")',
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <CardContent
            sx={{ flex: "1 1 50%", padding: "80px 120px", height: "100%" }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{ marginBottom: "60px" }}
              >
                {isRegistering ? "Register Account" : "Welcome back!"}
              </Typography>
              <TextField
                label="Cal Poly email"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: 2 }}
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
              <TextField
                label="Password"
                variant="outlined"
                type="password"
                fullWidth
                sx={{ marginBottom: 2 }}
                onChange={(e) => setPassword(e.target.value)}
              />
              {isRegistering && (
                <TextField
                  label="Reconfirm Password"
                  variant="outlined"
                  type="password"
                  fullWidth
                  sx={{ marginBottom: 2 }}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              )}
              {verificationSent && isPasswordValid && (
                <>
                  <Typography
                    variant="body2"
                    color="green"
                    sx={{ marginBottom: 2 }}
                  >
                    We sent you a verification email!
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      marginBottom: 2,
                    }}
                  >
                    <TextField
                      label="Verification Code"
                      variant="outlined"
                      fullWidth
                      sx={{ flex: "1 1 auto", marginRight: 1 }}
                      value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value)}
                    />
                    <Button
                      variant="text"
                      color="primary"
                      sx={{ marginLeft: 1 }}
                      onClick={async () => {
                        const code = generateCode();
                        setVerificationCode(code);

                        const response = await fetch("/api/login", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: userEmail,
                            code: code,
                          }),
                        });
                        

                        if (!response.ok) {
                          console.error("Failed to resend email.");
                        }
                      }}
                    >
                      Resend
                    </Button>
                  </Box>
                </>
              )}
              {!isRegistering && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    marginBottom: 2,
                  }}
                >
                  <FormControlLabel
                    control={<Checkbox color="primary" />}
                    label={
                      <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                        Remember 30 days
                      </Typography>
                    }
                  />
                  <Link
                    href="#"
                    variant="body2"
                    sx={{ fontSize: "0.8rem", alignSelf: "center" }}
                  >
                    Forgot password?
                  </Link>
                </Box>
              )}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ borderRadius: 2 }}
                onClick={async () => {
                  if (isRegistering) {
                    if (!verificationSent) {
                      // email not yet verified
                      if (validatePassword()) {
                        const code = generateCode();
                        setVerificationCode(code);

                        console.log("About to send email, userEmail is now " + userEmail);
                        const response = await fetch("/api/login", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: userEmail,
                            code: code,
                          }),
                        });

                        if (response.ok) {
                          setVerificationSent(true);
                        } else {
                          console.error("Failed to send email.");
                        }
                      } else {
                        console.log("Password validation failed!");
                      }
                    } else {
                      // email verification code sent
                      verifyCode();
                    }
                  } else {
                    // If logging in
                    // Add login logic here
                  }
                }}
              >
                {verificationSent
                  ? "Confirm"
                  : isRegistering
                  ? "Register"
                  : "Log in"}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                sx={{ borderRadius: 2, marginTop: 2 }}
                onClick={() => setIsRegistering(!isRegistering)}
              >
                {isRegistering ? "Back to Login" : "Register"}
              </Button>
            </Box>
          </CardContent>
        </Box>
      </Card>
    </Box>
  );
}