async function checkIfUserIsAdmin(request, response, next) {
  // Check if the user is on the request
  // request.customData.user - sorted out by another middleware
  // before this one runs

  // Check if the request user has isAdmin set to true
  if (request.customData.user.isAdmin) {
    next();
  } else {
    response.status(403).json({
      message: "You need to be an admin to access this API endpoint!",
    });
  }
}

async function checkIfUserIsTargetingThemselves(request, response, next) {
  // Compare the request.customData.user.id to request.params.userId
  // We can assume that checkForUserJwt has run already and placed a user
  // on to request.customData.user
  // We can also assume that this middleware be will used only routes with
  // request.params.userId (e.g. localhost:3000/users/asovajhdalkjv)

  if (request.customData.user.id == request.params.userId) {
    // The user is doing things about their own data
    next();
  } else {
    return response.status(403).json({
      message: "Cannot edit other users.",
    });
  }
}

module.exports = {
  checkIfUserIsAdmin,
  checkIfUserIsTargetingThemselves,
};
