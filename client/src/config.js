const env  = require('dotenv')
env.config();

module.exports = {
    studioServer: {
        BASE_URL: process.env.STUDIO_SERVER_BASE_URL || "http://localhost:9000/",
        CRED_LIST_EP: process.env.STUDIO_SERVER_CRED_LIST_EP || "api/credential/list",
        CRED_ISSUE_EP: process.env.STUDIO_SERVER_CRED_ISSUE_EP || "api/credential/issue",
        AUTH_CHALLENGE_EP: process.env.STUDIO_SERVER_AUTH_CHALLENGE_EP || "api/auth/challenge",
        AUTH_LOGIN_EP: process.env.STUDIO_SERVER_AUTH_LOGIN_EP || "api/auth/login"
    },
    nodeServer: {
        BASE_URL: process.env.NODE_SERVER_BASE_URL || "http://localhost:5000/",
        NETWORK_STATUS_EP: process.env.NODE_SERVER_NETWORK_STATUS_EP || "network/info",
        SCHEMA_LIST_EP: process.env.NODE_SERVER_SCHEMA_LIST_EP || "api/schema/list",
        SCHEMA_GET_EP: process.env.NODE_SERVER_SCHEMA_GET_EP || "api/schema/get",
        SCHEMA_CREATE_EP: process.env.NODE_SERVER_SCHEMA_CREATE_EP || "api/schema/create"
    },
    explorer: {
        BASE_URL: process.env.EXPLORER_BASE_URL || "http://localhost:5001/",
        NEW_DID_EP: process.env.EXPLORER_NEW_DID_EP || "explorer/newdid"
    }   
}