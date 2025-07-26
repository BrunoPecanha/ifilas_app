import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { ToastService } from './toast.service';  

@Injectable({
  providedIn: 'root'
})
export class QrScannerService {

  constructor(private toastService: ToastService) {}

  async scanQrCode(): Promise<string | null> {
    try {
      const result = await BarcodeScanner.scan();

      if (result.barcodes.length > 0) {
        const content = result.barcodes[0].rawValue;
        console.log('QR Code lido:', content);
        await this.toastService.show('QR Code lido com sucesso!', 'success');
        return content;
      } else {
        await this.toastService.show('Nenhum QR Code detectado.', 'warning');
        return null;
      }

    } catch (error) {
      console.error('Erro ao escanear QR Code:', error);
      await this.toastService.show('Erro ao escanear QR Code.', 'danger');
      return null;
    }
  }
}
