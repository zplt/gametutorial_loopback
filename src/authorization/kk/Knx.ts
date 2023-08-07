import {
    SERVICE_TYPE,
    CONNECTION_TYPE,
    PROTOCOL_TYPE,
    KNX_LAYER,
    FRAMETYPE,
    RESPONSECODE,
    MESSAGECODES,
    APCICODES,
    HdrOfIPv4,
    HdrOfCRI,
    HdrOfHPAI,
    HdrOfAPDU,
    HdrOfCEMI,
    HdrOfKNXHEADER,
    IpRouteConInstance,
    IpTunConInstance,
    CandidateInterfaces,
    Datagram,
    Options,
    RemoteEndpoint,
    DatapointOptions,
    DPT,
    ADDRESS_TYPE,
} from "./knx.interface";

const BinaryProtocol = require('binary-protocol');
import * as ipaddr from 'ipaddr.js';
import {Buffer} from 'buffer';

/*******KnxProtocol*******/

const KnxProtocol = new BinaryProtocol();

const twoLevelAddressing = KnxProtocol.twoLevelAddressing = false;
KnxProtocol.lengths = {};

//helper function: what is the byte length of an object?
//@zhri -> check the context:Buffer type
//@zhri -> how it is possible to check lenght with this method ????
const knxlen = (objectName: string, context: object): number => {
    const lf = KnxProtocol.lengths[objectName];
    return typeof lf === 'function' ? lf(context) : lf;
};

KnxProtocol.define('IPv4Endpoint', {
    read(propertyName: string) {
        let byteArray: number[];
        this.pushStack({addr: null, port: null})
            .raw('addr', 4)//@Zuhri reads 32 bits and assigns it the current stack
            .UInt16BE('port') //@Zuhri reads next two bytes
            .tap((hdr: HdrOfIPv4) => {
                byteArray = hdr.addr.toByteArray();
                hdr.addr = ipaddr.fromByteArray(byteArray);//@Zuhri convert from binary format to an IP address
            })
            .popStack(propertyName, (data: {
                addr: string,
                port: number | null
            }) => data.addr.toString() + ':' + data.port);
    },
    write(value: string) {
        if (!value) throw new Error('cannot write null value for IPv4Endpoint');

        if (typeof value !== 'string' || !value.match(/\d*\.\d*\.\d*\.\d*:\d*/))
            throw new Error('Invalid IPv4 endpoint, please set a string as \'ip.add.re.ss:port\'');

        const [addr, port] = value.split(':');
        this.raw(Buffer.from(ipaddr.parse(addr).toByteArray()), 4);
        this.UInt16BE(parseInt(port));
    },
});
KnxProtocol.lengths['IPv4Endpoint'] = (value: number) => (value ? 6 : 0)