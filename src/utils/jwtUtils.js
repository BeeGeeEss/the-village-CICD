const jwt = require("jsonwebtoken");

// Function to create JWTs
function generateJwt(targetUser){
	// generate a JWT that lasts 7 days and contains the targetUser.id 
	let newJwt = jwt.sign(
		// First arg is payload of custom token data, whatever we want 
		{
			userId: targetUser.id
		},
		// Second arg is the JWT secret key, never publicly share this
		process.env.JWT_SECRET_KEY,
		// Third arg is a payload of JWT-specification-specific data, such as expiresIn
		{
			expiresIn: "7d"
		}
	);
	return newJwt;
}

// Function to validate or verify a JWT 
function verifyJwt(targetJwt){
	// verify the JWT to make sure it came from our system AND is still valid / has not expired
	let decodedToken = jwt.verify(targetJwt, process.env.JWT_SECRET_KEY);

	return decodedToken;
}

module.exports = {
	generateJwt, verifyJwt
}