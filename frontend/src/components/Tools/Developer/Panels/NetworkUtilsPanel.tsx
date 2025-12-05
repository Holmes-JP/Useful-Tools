import { useState } from 'react';
import QRCode from 'qrcode';
import HashGenerator from '../../../Generators/HashGenerator/HashGenerator';

export default function NetworkUtilsPanel(){
    const [cidr, setCidr] = useState('192.168.0.0/24');
    const [subnetResult, setSubnetResult] = useState<any>(null);
    const [hashOut, setHashOut] = useState('');
    const [qrText, setQrText] = useState('');
    const [qrDataUrl, setQrDataUrl] = useState('');

    function calcSubnet(){
        try{
            const parts = cidr.split('/');
            const ipStr = parts[0];
            const mask = Number(parts[1] || 24);
            if (mask < 0 || mask > 32) throw new Error('mask');
            const ipInt = ipToInt(ipStr);
            if (ipInt === null) throw new Error('ip');
            const maskInt = mask === 0 ? 0 : (0xffffffff << (32 - mask)) >>> 0;
            const network = (ipInt & maskInt) >>> 0;
            const broadcast = (network | (~maskInt >>> 0)) >>> 0;
            const hostCount = mask >= 32 ? 1 : Math.max(0, Math.pow(2, 32 - mask) - (mask <= 30 ? 2 : 0));
            const firstHost = mask <= 30 ? (network + 1) >>> 0 : network;
            const lastHost = mask <= 30 ? (broadcast - 1) >>> 0 : broadcast;
            setSubnetResult({
                cidr: `${intToIp(network)}/${mask}`,
                netmask: intToIp(maskInt),
                network: intToIp(network),
                broadcast: intToIp(broadcast),
                firstHost: intToIp(firstHost),
                lastHost: intToIp(lastHost),
                hosts: hostCount,
            });
        }catch(e:any){
            alert('Invalid CIDR');
            setSubnetResult(null);
        }
    }

    function ipToInt(ip: string): number | null {
        const parts = ip.split('.').map(p => Number(p));
        if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null;
        return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
    }

    function intToIp(num: number): string {
        return [
            (num >>> 24) & 255,
            (num >>> 16) & 255,
            (num >>> 8) & 255,
            num & 255
        ].join('.');
    }

    // Hash generation handled by shared HashGenerator (simple mode)

    async function genQr(){
        try{
            const url = await QRCode.toDataURL(qrText || '');
            setQrDataUrl(url);
        }catch(e:any){
            alert('QR generation failed');
        }
    }

    return (
        <div className="space-y-6">
            <section>
                <h4 className="text-lg font-semibold text-white">IPv4 Subnet Calculator</h4>
                <div className="mt-2 flex gap-2">
                    <input className="flex-1 bg-gray-800 p-2 rounded" value={cidr} onChange={e=>setCidr(e.target.value)} />
                    <button className="px-3 py-1 bg-primary-500 rounded text-black" onClick={calcSubnet}>Calc</button>
                </div>
                {subnetResult && (
                    <pre className="bg-gray-900 p-2 rounded mt-2">{JSON.stringify(subnetResult, null, 2)}</pre>
                )}
            </section>

            <section>
                <HashGenerator simple simpleAlgo={['MD5','SHA1','SHA256']} onSimpleGenerate={(val) => setHashOut(val)} />
                <input readOnly className="w-full bg-gray-900 p-2 rounded mt-2" value={hashOut} />
            </section>

            <section>
                <h4 className="text-lg font-semibold text-white">QR Code Generator</h4>
                <div className="mt-2 flex gap-2">
                    <input className="flex-1 bg-gray-800 p-2 rounded" value={qrText} onChange={e=>setQrText(e.target.value)} placeholder="Text or URL" />
                    <button className="px-3 py-1 bg-primary-500 rounded text-black" onClick={genQr}>Generate</button>
                </div>
                {qrDataUrl && <img src={qrDataUrl} alt="qr" className="mt-2" />}
            </section>
        </div>
    );
}
