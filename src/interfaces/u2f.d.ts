declare module 'u2f' {
    /**
     * Reply interface for requests  
     * 
     * @interface IRequest
     */
    interface IRequest {
        version: string;
        appId: string;
        challenge: string;
        keyHandle?: string; 
    }

    /**
     * Key registration message. Conforms to U2F specification 
     * 
     * @interface IRegisterData
     */
    interface IRegisterData {
        clientData: string; // stirng, base64 encoded message of serialized JSON
        registrationData: string; // binary, base64 encoded digitally signed registration
    }

    /**
     * Digitally signed authentication message 
     * 
     * @interface ISignatureData
     */
    interface ISignatureData {
        clientData: string; // stirng, base64 encoded message of serialized JSON
        signatureData: string; // binary, base64 encoded digitally signed authentication
    }

    /**
     * Digitally signed registration message 
     * 
     * @interface IRegistrationReply
     */
    interface IRegistrationReply {
        successful: boolean;
        publicKey?: string;
        keyHandle?: string;
        certificate?: string;
        errorMessage?: string;
    }

    /**
     * Check Signature reply
     * 
     * @interface ISignatureReply
     */
    interface ISignatureReply {
        successful: boolean; 
        userPresent?: boolean;
        counter?: number;
        errorMessage?: string;
    }

    /**
     * Generate a request for the client. The request is specific for 
     * a given key and app ID
     * 
     * @param {string} appId
     * @param {string} keyHandle
     * @returns {IRequest}
     */
    function request(appId: string, keyHandle: string): IRequest;

    /**
     * Check the digital signature on the registration data. Does 
     * 
     * @param {IRequest} request
     * @param {IRegisterData} registerData
     */
    function checkRegistration(request: IRequest, registerData: IRegisterData): IRegistrationReply;


    /**
     * Function to check digitally signed authentication. 
     * 
     * @param {IRequestWChallenge} request
     * @param {ISignatureData} signResult
     * @param {string} publicKey
     */
    function checkSignature(request: IRequest, signResult: ISignatureData, publicKey: string): ISignatureReply;

    /* NOTE: Supplemental API not exposed */
}