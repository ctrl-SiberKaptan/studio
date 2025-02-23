
import PresentationRequestSchema , { IPresentationRequest } from "../models/PresentationRequest";
import PresentationTemplateSchema, {IPresentationTemplate} from "../models/presentationTemplateSchema";
import OrgSchema, { IOrg } from "../models/OrgSchema";
import { studioServerBaseUrl} from '../config';

import { uuid } from 'uuidv4';


import HIDWallet from 'hid-hd-wallet'
import HypersignSsiSDK from "hs-ssi-sdk";
import { walletOptions, mnemonic } from '../config'

const verifyPresentation = async (vp, challenge, issuerDid, holderDid, domain) => {
    try {
        console.log({
            vp, challenge, issuerDid, holderDid, domain
        })

        // TODO: This initialization need to be done one time globally 
        const hidWalletInstance = new HIDWallet(walletOptions);
        await hidWalletInstance.generateWallet({ mnemonic });
        const hsSdk = new HypersignSsiSDK(hidWalletInstance.offlineSigner, walletOptions.hidNodeRPCUrl, walletOptions.hidNodeRestUrl, 'devnet')
        await hsSdk.init();
        
        const result = await hsSdk.vp.verifyPresentation({
            signedPresentation: vp,
            challenge,
            domain,
            issuerDid,
            holderDid,
        })
        return result;
    } catch (error) {
        console.error(error)
    }
}

function writeServerSendEvent(res, sseId, data) {
    res.write('id: ' + sseId + '\n');
    res.write('data: ' +  data + '\n\n');
}

export async function  verify (req, res, next){

    const { challenge, vp } = req.body;
    if(!challenge || !vp) {
        return res.status(400).send({ status: 400,  message: null, error: "challenge and vp must be passed"})
    }

    // TODO: 1. fetch challeng record from db, if not throw error
    const presentationRequest: IPresentationRequest = await PresentationRequestSchema.findOne({challenge: challenge, status: 0 }) as IPresentationRequest
    if(!presentationRequest){
        return res.status(401).send({ status: 401, message: null, error: 'Invalid challenge. Refresh the page and try again.' });
    }

    const { expiresTime, templateId } = presentationRequest;
    const presentationTemplate: IPresentationTemplate = await PresentationTemplateSchema.findOne({_id: templateId }) as IPresentationTemplate
    if(!presentationTemplate){
        return res.status(400).send({ status: 400, message: null, error: 'Invalid templateId' });
    }
    
    // TODO: 2. check the exprity time of the challege , if not throw error
    const now: number = (new Date()).getTime();
    if(now > expiresTime){
        return res.status(401).send({ status: 401, message: null, error: 'The session expired. Refresh the page and try again.' });
    }

    // TODO: 3. verify the presentation, if not throw error
    const parsedVP =  JSON.parse(vp);
    const vc  = parsedVP.verifiableCredential[0] // TODO: You should not hard code to fetch just one vc;  you should get holderDid from request body
    const templateIssuers: Array<string> = presentationTemplate.issuerDid;
    const result = await verifyPresentation(
        parsedVP, 
        challenge, 
        templateIssuers[0], //  TODO: Need to fix this hardcoing
        vc.credentialSubject.id, 
        presentationTemplate.domain
    )

    const  {verified } =  result.presentationResult;
    if(verified === true){
        // TODO: 4. send data or create JWT

        // TODO: 5. Update the status to success i.e 1 in background
        PresentationRequestSchema.findOneAndUpdate({ challenge: challenge }, { status: 1 }).exec()
        
        return res.status(200).send({ status: 200, message: 'OK', error: null })
    }else {
        // TODO: 4. send data or create JWT
        return res.status(401).send({ status: 401, message: null, error: 'Unauthorized' })
    }
}

export async function getChallenge(req, res, next) {    
    try {
        const { presentationTemplateId } = req.params;
        if(!presentationTemplateId){
            return res.status(400).send('presentationTemplateId can not be null or empty')
        }
        
        // Fetch the presentation template presentationTemplateId
        const presentationTemplate: IPresentationTemplate = await PresentationTemplateSchema.findOne({_id: presentationTemplateId }) as IPresentationTemplate
        if(!presentationTemplate){
            return res.status(400).send('invalid presentationTemplateId = '+ presentationTemplateId)
        }

        const  { schemaId , templateOwnerDid, orgDid, domain } = presentationTemplate;

        const org: IOrg = await OrgSchema.findOne({ _id :orgDid}) as IOrg;

        const { name } = org;

        
        const challenge = uuid();
        const now = new Date();
        const expiresTime = now.setMinutes(now.getMinutes() + 1); // 5 mintues from now will expires.
        const pRequest = await new PresentationRequestSchema({ 
                templateId: presentationTemplateId, 
                challenge,
                expiresTime,
                status: 0
            }).save();
        // For the QR Data
        // Insert a new challenge in db
        const QR_DATA =  {
            "op":"init",
            "data":
            {
                "QRType":"REQUEST_CRED",
                "serviceEndpoint": `${studioServerBaseUrl}/api/v1/presentation/request/verify/`,
                "schemaId": "ssi/schema/"+ schemaId,
                "appDid": templateOwnerDid,
                "appName": name,
                challenge
            }
        }

        console.log("==========SchemaController ::getSchemaById Ends================")
        res.setHeader('Access-Control-Allow-Origin', domain);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('X-Accel-Buffering', 'no')

        var sseId = challenge;

        const setinterval = setInterval(function() {
            PresentationRequestSchema.findOne({challenge: challenge }).then(result => {
                if(result){
                    const QR_DATA = {
                        op: "",
                        message: ""
                    }
                    if(result.status === 1){
                        QR_DATA.op = 'end'
                        QR_DATA['message'] = 'Verified';
                        // TODO: 4. end the interval and end the response 
                        writeServerSendEvent(res, sseId, JSON.stringify(QR_DATA));

                        // The interval will be closed one its verified
                        clearInterval(setinterval)
                        return res.end();
                    } else {
                        QR_DATA.op = 'processing'
                        QR_DATA['message'] = 'Waiting for verificaiton...';
                        // TODO: 4.  wait till the challege is verified
                        writeServerSendEvent(res, sseId, JSON.stringify(QR_DATA));
                    }    
                }
            }).catch(err => {
                console.error(err);
            })
        }, 5000); // TODO: Take this in env,  sending every 10 sec

        // The interval should also close once the challenge is expired
        setTimeout(() => {
            const QR_DATA = {
                op: "",
                message: ""
            }
            QR_DATA.op = 'end'
            QR_DATA['message'] = 'Challenge expired';
            
            writeServerSendEvent(res, sseId, JSON.stringify(QR_DATA));
            clearInterval(setinterval)
            return res.end();
        }, expiresTime - Date.now());
        
        writeServerSendEvent(res, sseId, JSON.stringify(QR_DATA));
    
    } catch (error) {
        console.error("==========SchemaController ::getSchemaById Ends================")
        res.status(500).json(error)
    }
}