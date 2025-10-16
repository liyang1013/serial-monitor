export interface SerialPortInfo {
    path: string,
    manufacturer: string,
    serialNumber?: string,
    pnpId: string,
    locationId: string,
    friendlyName: string,
    vendorId?: number,
    productId?: number
}