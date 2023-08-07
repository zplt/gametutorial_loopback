import {EventEmitter} from 'events';
import * as ipaddr from 'ipaddr.js';
import * as dgram from "dgram";
import {Buffer} from "buffer";


//************ADDRESS**********START*//
enum ADDRESS_TYPE {
    PHYSICAL = 0x00,
    GROUP = 0x01,
}
//************ADDRESS**********END*//

//************DPT**********START*//
type KnxGroupAddress = string

interface DPT {
    id: string;
    basetype: {
        bitlength: number;
        valuetype: string;
        desc: string;
        range?: [number, number];
        signedness?: string;
    };
}

interface DatapointOptions {
    ga: KnxGroupAddress,
    dpt?: DPT,
    autoread?: boolean,
}
//************DPT**********END*//


//*******CONNECTION*****START*//
interface RemoteEndpoint {
    addrstring: string;
    addr: ipaddr.IPv4 | ipaddr.IPv6;
    port: number;
}


interface Options {
    ipAddr?: string;
    ipPort?: number;
    forceTunneling?: boolean;
    localEchoInTunneling?: boolean;
    interface?: string;
    minimumDelay?: number;
}

interface Datagram  {
    header_length: number,
    protocol_version: number,
    service_type: number,
    total_length: number,
    connstate: {
        channel_id: number,
        status: number
    },
    tunnstate: {
        header_length: number,
        channel_id: number,
        seqnum: number,
        rsvd: number
    },
    cemi: {
        msgcode: number,
        addinfo_length: number,
        ctrl: {
            frameType: number,
            reserved: number,
            repeat: number,
            broadcast: number,
            priority: number,
            acknowledge: number,
            confirm: number,
            destAddrType: number,
            hopCount: number,
            extendedFrame: number
        },
        src_addr: string,
        dest_addr: string,
        apdu: {
            tpci: number,
            apci: string,
            data: number
        }
    }
}

interface NetworkInterfaceInfoIPv4 {
    address: string;
    netmask: string;
    family: string;
}
interface CandidateInterfaces {
    [iface: string]: NetworkInterfaceInfoIPv4;
}

interface IpTunConInstance {
    localAddress: string;
    socket: dgram.Socket;
    getLocalAddress(): string;
    BindSocket(cb: (socket: dgram.Socket) => void): dgram.Socket;
    onUdpSocketMessage(msg: Buffer, rinfo: dgram.RemoteInfo, callback: () => void): void;
    transition(state: string): void;
    Connect(): this;
}

interface IpRouteConInstance {
    localAddress: string;
    remoteEndpoint: {
        addr: string;
    };
    socket: dgram.Socket;
    getLocalAddress(): string;
    BindSocket(cb: (socket: dgram.Socket) => void): dgram.Socket;
    onUdpSocketMessage(msg: Buffer, rinfo: dgram.RemoteInfo, callback: () => void): void;
    transition(state: string): void;
    Connect(): this;
}
//**********CONNECTION*****END*//

//**********KNX_PROTOCOL*****START*//
interface HdrOfIPv4  {
    addr: ipaddr.IPv4 | ipaddr.IPv6;
    port: number;
}

interface HdrOfCRI  {
    header_length: 0,
    connection_type: number | null,
    knx_layer: null,
    unused: null,
}


interface HdrOfHPAI {
    header_length: 8;
    protocol_type: number | null;
    tunnel_endpoint: null;
}

//@zhri creating the interface to adjust to value.data.bitlenght
interface BitlengtBuffer extends Buffer{
    bitlength?:number;
}

interface HdrOfAPDU  {
    apdu_length: number,
    apdu_raw: Buffer,
    tpci: number,
    apci: string,
    data: BitlengtBuffer,
    bitlength:number
}

//Defining CEMI Frame
interface HdrOfCEMI  {
    msgcode: number,
    addinfo_length: number,
    ctrl: {
        frameType: number,
        reserved: number,
        repeat: number,
        broadcast: number,
        priority: number,
        acknowledge: number,
        confirm: number,
        destAddrType: number,
        hopCount: number,
        extendedFrame: number,
    },
    src_addr: Buffer | string,
    dest_addr: Buffer | string,
    apdu: object, // Assuming that the type of 'apdu' is an object
};

//Defining KNXNetHeader
interface HdrOfKNXHEADER{
    header_length: number,
    protocol_version: number,
    service_type: number,
    total_length: number,
    hpai:object,
    tunn:object,
    cri:object,
    connstate:object,
    tunnstate:object,
    cemi:object,
}


//**********KNX_PROTOCOL*****END*//

const SERVICE_TYPE = {
    SEARCH_REQUEST: 0x0201,
    SEARCH_RESPONSE: 0x0202,
    DESCRIPTION_REQUEST: 0x0203,
    DESCRIPTION_RESPONSE: 0x0204,
    CONNECT_REQUEST: 0x0205,
    CONNECT_RESPONSE: 0x0206,
    CONNECTIONSTATE_REQUEST: 0x0207,
    CONNECTIONSTATE_RESPONSE: 0x0208,
    DISCONNECT_REQUEST: 0x0209,
    DISCONNECT_RESPONSE: 0x020a,
    DEVICE_CONFIGURATION_REQUEST: 0x0310,
    DEVICE_CONFIGURATION_ACK: 0x0311,
    TUNNELING_REQUEST: 0x0420,
    TUNNELING_ACK: 0x0421,
    ROUTING_INDICATION: 0x0530,
    ROUTING_LOST_MESSAGE: 0x0531,
    UNKNOWN: -1,
};

//@Zhri -> CRI(connection request information) stay in Control bit
const CONNECTION_TYPE = {
    DEVICE_MGMT_CONNECTION: 0x03,
    TUNNEL_CONNECTION: 0x04,
    REMOTE_LOGGING_CONNECTION: 0x06,
    REMOTE_CONFIGURATION_CONNECTION: 0x07,
    OBJECT_SERVER_CONNECTION: 0x08,
};

const PROTOCOL_TYPE = {
    IPV4_UDP: 0x01,
    IPV4_TCP: 0x02,
};

const KNX_LAYER = {
    LINK_LAYER: 0x02 /* Tunneling on link layer, establishes a link layer tunnel to the KNX network. */,
    RAW_LAYER: 0x04 /* Tunneling on raw layer, establishes a raw tunnel to the KNX network. */,
    BUSMONITOR_LAYER: 0x80 /* Tunneling on busmonitor layer, establishes a busmonitor tunnel to the KNX network. */,
};

const FRAMETYPE = {
    EXTENDED: 0x00,
    STANDARD: 0x01,
};

const RESPONSECODE = {
    NO_ERROR: 0x00, // E_NO_ERROR - The connection was established successfully
    E_HOST_PROTOCOL_TYPE: 0x01,
    E_VERSION_NOT_SUPPORTED: 0x02,
    E_SEQUENCE_NUMBER: 0x04,
    E_CONNSTATE_LOST: 0x15, // typo in eibd/libserver/eibnetserver.cpp:394, forgot 0x prefix ??? "uchar res = 21;"
    E_CONNECTION_ID: 0x21, // - The KNXnet/IP server device could not find an active data connection with the given ID
    E_CONNECTION_TYPE: 0x22, // - The requested connection type is not supported by the KNXnet/IP server device
    E_CONNECTION_OPTION: 0x23, // - The requested connection options are not supported by the KNXnet/IP server device
    E_NO_MORE_CONNECTIONS: 0x24, // - The KNXnet/IP server could not accept the new data connection (Maximum reached)
    E_DATA_CONNECTION: 0x26, // - The KNXnet/IP server device detected an error concerning the Dat connection with the given ID
    E_KNX_CONNECTION: 0x27, // - The KNXnet/IP server device detected an error concerning the KNX Bus with the given ID
    E_TUNNELING_LAYER: 0x29,
};

const MESSAGECODES = {
    'L_Raw.req': 0x10,
    'L_Data.req': 0x11,
    'L_Poll_Data.req': 0x13,
    'L_Poll_Data.con': 0x25,
    'L_Data.ind': 0x29,
    'L_Busmon.ind': 0x2b,
    'L_Raw.ind': 0x2d,
    'L_Data.con': 0x2e,
    'L_Raw.con': 0x2f,
    'ETS.Dummy1': 0xc1, // UNKNOWN: see https://bitbucket.org/ekarak/knx.js/issues/23
};

const APCICODES = [
    'GroupValue_Read',
    'GroupValue_Response',
    'GroupValue_Write',
    'PhysicalAddress_Write',
    'PhysicalAddress_Read',
    'PhysicalAddress_Response',
    'ADC_Read',
    'ADC_Response',
    'Memory_Read',
    'Memory_Response',
    'Memory_Write',
    'UserMemory',
    'DeviceDescriptor_Read',
    'DeviceDescriptor_Response',
    'Restart',
    'OTHER',
];

const KnxConstants = {
    SERVICE_TYPE,
    CONNECTION_TYPE,
    PROTOCOL_TYPE,
    KNX_LAYER,
    FRAMETYPE,
    RESPONSECODE,
    MESSAGECODES,
    APCICODES,

};

/* TODO helper function to print enum keys */

export const keyText=(mapref: keyof typeof KnxConstants, value:object | number | string | null): string | undefined => {
    // pass in map by name or value
    const map = KnxConstants[mapref] || mapref;
    if (typeof map !== 'object') throw new Error('Unknown map: ' + mapref);
    for (const [key, v] of Object.entries(map)) if (v === value) return key;
    console.log('not found: %j', value)
};

export {
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
};


export default KnxConstants;
