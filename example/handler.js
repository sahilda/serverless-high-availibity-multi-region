"use strict";

console.log("Loading multi-region hello function");

module.exports.multiRegion = async (event) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      data: `Hello from region ${process.env.AWS_REGION}`,
    }),
  };
  return response;
};
