import QRCode from 'qrcode';

export function toDataURL(data: string): Promise<string> {
	return QRCode.toDataURL(data, { width: 256, margin: 2 });
}
