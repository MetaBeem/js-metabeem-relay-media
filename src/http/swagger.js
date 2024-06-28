import swaggerJSDoc from "swagger-jsdoc";

const options =
{
	swaggerDefinition : {
		openapi : "3.0.0",
		info : {
			title: "MetaBeem Media",
			version: "1.0.0",
			description: "MetaBeem Media Service",
		},
	},
	apis: [ './httpRoutes.js' ], // Path to the API routes in your Node.js application
};

const swaggerSpec = swaggerJSDoc( options );
//module.exports = swaggerSpec;
export default swaggerSpec;